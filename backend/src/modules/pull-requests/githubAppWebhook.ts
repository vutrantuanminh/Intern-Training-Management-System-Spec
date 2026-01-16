import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { traineeRepoService } from './traineeRepoService';
import { sendNotification } from '../../socket';

// Verify GitHub webhook signature
function verifyGitHubSignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Extract trainee ID from PR body or branch name
function extractTraineeId(pr: any): number | null {
  // Try to extract from PR body first (format: trainee_id:123)
  const bodyMatch = pr.body?.match(/trainee_id:(\d+)/);
  if (bodyMatch) {
    return parseInt(bodyMatch[1]);
  }

  // Try to extract from branch name (format: trainee-123-feature)
  // For issue_comment, pr may not have head.ref, so check for head and ref safely
  if (pr.head && pr.head.ref) {
    const branchMatch = pr.head.ref.match(/trainee-(\d+)/);
    if (branchMatch) {
      return parseInt(branchMatch[1]);
    }
  }

  // For issue_comment payload, try to extract from title (e.g., "trainee-123: ...")
  if (pr.title) {
    const titleMatch = pr.title.match(/trainee-(\d+)/);
    if (titleMatch) {
      return parseInt(titleMatch[1]);
    }
  }

  // If nothing found, return null
  return null;
}

// Main GitHub App webhook handler
export async function githubAppWebhookHandler(req: Request, res: Response) {
  try {
    // Debug: log headers and body
    console.log('[Webhook] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Webhook] Body:', JSON.stringify(req.body, null, 2));

    // Verify webhook signature
    if (!verifyGitHubSignature(req)) {
      console.error('[Webhook] Invalid signature');
      res.status(401).send('Invalid signature');
      return;
    }

    const event = req.headers['x-github-event'] as string;
    const payload = req.body;

    console.log(`[Webhook] Received GitHub event: ${event}`);

    // Handle different GitHub events
    try {
      switch (event) {
        case 'pull_request':
          await handlePullRequestEvent(payload);
          break;
        case 'issue_comment':
          await handleIssueCommentEvent(payload);
          break;
        case 'pull_request_review':
          await handlePullRequestReviewEvent(payload);
          break;
        default:
          console.log(`[Webhook] Unhandled event: ${event}`);
      }
      res.status(200).send('Webhook processed');
    } catch (eventError: any) {
      console.error(`[Webhook] Error in event handler for ${event}:`, eventError);
      res.status(500).json({
        error: `Error in event handler for ${event}`,
        message: eventError?.message,
        stack: eventError?.stack,
      });
    }
  } catch (error: any) {
    console.error('[Webhook] Error processing GitHub webhook:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error?.message,
      stack: error?.stack,
    });
  }
}

// Handle pull_request events (opened, closed, merged, etc.)
async function handlePullRequestEvent(payload: any) {
  const action = payload.action;
  const pr = payload.pull_request;
  const repo = payload.repository;
  const repoName = repo.full_name; // e.g., "owner/repo"

  console.log(`PR ${action}: ${pr.title} in ${repoName}`);

  // Extract trainee ID first
  const traineeId = extractTraineeId(pr);
  if (!traineeId) {
    console.log('Could not extract trainee ID from PR');
    return;
  }

  // Find the course - check both CourseRepo and TraineeRepo
  const courseId = await traineeRepoService.findCourseByRepo(repoName, traineeId);
  
  if (!courseId) {
    console.log(`No course found for repo: ${repoName}`);
    return;
  }

  // Get trainers for notification
  const courseWithTrainers = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      trainers: { select: { trainerId: true } },
    },
  });

  // For opened PR, we don't create it yet - wait for "ready" comment
  if (action === 'opened') {
    console.log(`PR opened, waiting for 'ready' comment from trainee ${traineeId}`);
    return;
  }

  // Nếu PR đã tồn tại và trainee cập nhật (push commit mới hoặc sửa mô tả), gửi thông báo cho trainer
  if (action === 'synchronize' || action === 'edited') {
    const existingPR = await prisma.pullRequest.findFirst({
      where: {
        repoName,
        prNumber: pr.number,
      },
      include: {
        course: {
          include: { trainers: { select: { trainerId: true } } },
        },
        trainee: true,
      },
    });
    if (existingPR) {
      await prisma.pullRequest.update({
        where: { id: existingPR.id },
        data: {
          // Chỉ update updatedAt, giữ nguyên createdAt
          updatedAt: new Date(),
          // Optionally update description/title nếu muốn
          title: pr.title,
          description: pr.body || '',
        },
      });
      // Notify all trainers
      const trainers = existingPR.course.trainers;
      const trainee = existingPR.trainee;
      const trainerNotifications = trainers.map((t) => ({
        userId: t.trainerId,
        type: 'PR' as const,
        title: 'Pull Request Updated',
        message: `${trainee.fullName} (ID: ${trainee.id}) updated PR "${pr.title}". Please review the latest changes!`,
        linkTo: pr.html_url,
      }));
      if (trainerNotifications.length > 0) {
        await prisma.notification.createMany({ data: trainerNotifications });
        for (const notif of trainerNotifications) {
          sendNotification(notif.userId, {
            id: 0,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            linkTo: notif.linkTo ?? undefined,
          });
        }
      }
    }
  }

  // For closed/merged PR, update status
  if (action === 'closed') {
    const existingPR = await prisma.pullRequest.findFirst({
      where: {
        repoName,
        prNumber: pr.number,
      },
    });

    if (existingPR) {
      await prisma.pullRequest.update({
        where: { id: existingPR.id },
        data: {
          status: pr.merged ? 'APPROVED' : 'REJECTED',
          reviewedAt: new Date(),
        },
      });

      // Notify trainee
      await prisma.notification.create({
        data: {
          userId: existingPR.traineeId,
          type: 'PR',
          title: pr.merged ? 'Pull Request Merged' : 'Pull Request Closed',
          message: `Your PR "${pr.title}" has been ${pr.merged ? 'merged' : 'closed'}`,
          linkTo: pr.html_url,
        },
      });
    }
  }
}

// Handle issue_comment events (for "ready" comment detection)
async function handleIssueCommentEvent(payload: any) {
  try {
    const action = payload.action;
    const comment = payload.comment;
    const issue = payload.issue;
    const repo = payload.repository;
    const repoName = repo.full_name;

    // Check if this is a PR comment (not a regular issue)
    if (!issue.pull_request) {
      return;
    }

    // Check if comment contains "ready"
    if (!comment.body.toLowerCase().includes('ready')) {
      return;
    }

    console.log(`Ready comment detected on PR #${issue.number} in ${repoName}`);

    // Extract trainee ID first
    let traineeId = extractTraineeId(issue);
    console.log('[Webhook] Extracted traineeId from body/branch:', traineeId);
    if (!traineeId && issue.user?.login) {
      // Try to find traineeId from githubId or githubUsername
      const trainee = await prisma.user.findFirst({
        where: {
          OR: [
            { githubId: issue.user.login },
            { githubUsername: issue.user.login },
          ],
        },
        select: { id: true }
      });
      traineeId = trainee?.id || null;
      console.log('[Webhook] Fallback traineeId from githubId/githubUsername', issue.user.login, '=>', traineeId);
    }
    if (!traineeId) {
      console.log('[Webhook] Could not extract trainee ID from PR. issue.user.login:', issue.user?.login, 'repo:', repoName, 'issue:', issue.number);
      throw new Error('Could not extract traineeId');
    }

    // Find the course - check both CourseRepo and TraineeRepo
    const courseId = await traineeRepoService.findCourseByRepo(repoName, traineeId);
    console.log('[Webhook] Found courseId for repo:', repoName, 'traineeId:', traineeId, '=>', courseId);
    if (!courseId) {
      console.log(`[Webhook] No course found for repo: ${repoName}, traineeId: ${traineeId}`);
      throw new Error('No course found for repo and traineeId');
    }

    // Get trainers for notification
    const courseWithTrainers = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        trainers: { select: { trainerId: true } },
      },
    });

    if (!courseWithTrainers) {
      console.log(`[Webhook] Course not found in DB: ${courseId}`);
      throw new Error('Course not found in DB');
    }

    // Check if trainee exists
    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
      select: { id: true, fullName: true, email: true, githubId: true },
    });

    if (!trainee) {
      console.log(`[Webhook] Trainee not found in DB: ${traineeId}`);
      throw new Error('Trainee not found in DB');
    }

    // Check if PR already exists in database
    const existingPR = await prisma.pullRequest.findFirst({
      where: {
        repoName,
        prNumber: issue.number,
      },
    });

    if (existingPR) {
      console.log('[Webhook] PR already exists in database:', repoName, 'PR#', issue.number);
      return;
    }

    // Create PR in database
    const newPR = await prisma.pullRequest.create({
      data: {
        traineeId,
        courseId: courseId,
        title: issue.title,
        description: issue.body || '',
        repoUrl: repo.html_url,
        prUrl: issue.html_url,
        prNumber: issue.number,
        repoName,
        githubUserId: comment.user.id.toString(),
        status: 'PENDING',
      },
    });

    console.log(`PR created in database: ${newPR.id}`);

    // Notify all trainers of this course
    const trainerNotifications = courseWithTrainers.trainers.map((t) => ({
      userId: t.trainerId,
      type: 'PR' as const,
      title: 'New Pull Request Ready for Review',
      message: `${trainee.fullName} (ID: ${traineeId}) submitted PR "${issue.title}"`,
      linkTo: issue.html_url,
    }));

    if (trainerNotifications.length > 0) {
      // Lưu notification vào DB
      const created = await prisma.notification.createMany({
        data: trainerNotifications,
      });
      console.log(`Notified ${trainerNotifications.length} trainers`);
      // Gửi notification real-time qua Socket.IO
      for (const notif of trainerNotifications) {
        sendNotification(notif.userId, {
          id: 0, // ID notification không có vì createMany không trả về từng ID, frontend chỉ cần message
          type: notif.type,
          title: notif.title,
          message: notif.message,
          linkTo: notif.linkTo ?? undefined,
        });
      }
    }
  } catch (err: any) {
    console.error('[Webhook] Error in handleIssueCommentEvent:', err);
    throw err;
  }
}

// Handle pull_request_review events
async function handlePullRequestReviewEvent(payload: any) {
  const action = payload.action;
  const review = payload.review;
  const pr = payload.pull_request;
  const repo = payload.repository;
  const repoName = repo.full_name;

  console.log(`PR review ${action}: ${pr.title} in ${repoName}`);

  // Find existing PR in database
  const existingPR = await prisma.pullRequest.findFirst({
    where: {
      repoName,
      prNumber: pr.number,
    },
    include: {
      trainee: true,
      course: true,
    },
  });

  if (!existingPR) {
    console.log('PR not found in database');
    return;
  }

  // Find reviewer
  const reviewer = await prisma.user.findFirst({
    where: { githubId: review.user.id.toString() },
  });

  // Update PR status based on review state
  if (review.state === 'approved') {
    await prisma.pullRequest.update({
      where: { id: existingPR.id },
      data: {
        status: 'APPROVED',
        reviewerId: reviewer?.id,
        reviewedAt: new Date(),
      },
    });
  } else if (review.state === 'changes_requested') {
    await prisma.pullRequest.update({
      where: { id: existingPR.id },
      data: {
        reviewerId: reviewer?.id,
        reviewedAt: new Date(),
      },
    });
  }

  // Notify trainee about the review
  const notif = await prisma.notification.create({
    data: {
      userId: existingPR.traineeId,
      type: 'PR',
      title: `PR Review: ${review.state}`,
      message: `Your PR "${pr.title}" in ${existingPR.course.title} has been reviewed: ${review.state}`,
      linkTo: pr.html_url,
    },
  });
  // Gửi notification real-time qua Socket.IO
  sendNotification(existingPR.traineeId, {
    id: notif.id,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    linkTo: notif.linkTo ?? undefined,
  });
  console.log(`Trainee ${existingPR.traineeId} notified about review`);
}
