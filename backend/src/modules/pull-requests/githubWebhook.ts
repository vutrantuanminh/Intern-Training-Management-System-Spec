import { Request, Response } from 'express';
// Import your notification and course/user services here

export async function githubWebhookHandler(req: Request, res: Response) {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  // Helper: Find course, trainers, trainee by PR/repo mapping
  async function getCourseAndUsersByPR(pr: any, repo: any) {
    // TODO: Implement DB lookup to find courseId, traineeId, trainerIds
    // Example:
    // const course = await CourseService.findByRepoUrl(repo.html_url);
    // const trainee = await UserService.findByGithubId(pr.user.id);
    // const trainers = await CourseService.getTrainers(course.id);
    return { courseId: null, traineeId: null, trainerIds: [] };
  }

  // Helper: Send notification
  async function sendNotification(userId: number, type: string, title: string, message: string, linkTo?: string) {
    // TODO: Call your notification service/model here
    // await NotificationService.create({ userId, type, title, message, linkTo });
  }

  if (event === 'pull_request') {
    const action = payload.action;
    const pr = payload.pull_request;
    const repo = payload.repository;
    const { courseId, traineeId, trainerIds } = await getCourseAndUsersByPR(pr, repo);

    // Notify trainers for PR events
    if (trainerIds && trainerIds.length > 0) {
      for (const trainerId of trainerIds) {
        await sendNotification(
          trainerId,
          'PR',
          `PR ${action}: ${pr.title}`,
          `Pull request ${action} by ${pr.user.login} in ${repo.name}`,
          pr.html_url
        );
      }
    }

    // Notify trainee when trainer acts (merged, reviewed, commented)
    if (traineeId && ['closed', 'review_requested', 'reviewed', 'commented'].includes(action)) {
      await sendNotification(
        traineeId,
        'PR',
        `Trainer ${action} your PR: ${pr.title}`,
        `Trainer performed ${action} on your pull request in ${repo.name}`,
        pr.html_url
      );
    }
  }

  // Handle pull_request_review and issue_comment events for trainer actions
  if (event === 'pull_request_review' || event === 'issue_comment') {
    const pr = payload.pull_request || payload.issue;
    const repo = payload.repository;
    const { courseId, traineeId, trainerIds } = await getCourseAndUsersByPR(pr, repo);

    // Notify trainee for trainer actions
    if (traineeId) {
      await sendNotification(
        traineeId,
        'PR',
        `Trainer ${event} on your PR: ${pr.title}`,
        `Trainer performed ${event} on your pull request in ${repo.name}`,
        pr.html_url
      );
    }
    // Optionally notify trainers for comments/reviews
    if (trainerIds && trainerIds.length > 0) {
      for (const trainerId of trainerIds) {
        await sendNotification(
          trainerId,
          'PR',
          `PR ${event}: ${pr.title}`,
          `Pull request event ${event} in ${repo.name}`,
          pr.html_url
        );
      }
    }
  }

  res.status(200).send('Webhook received');
}
