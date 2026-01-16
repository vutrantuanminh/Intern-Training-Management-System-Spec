import { Router, Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import jwt from 'jsonwebtoken';

const router = Router();

// GitHub OAuth - Redirect to GitHub for authorization
router.get('/github', (req: Request, res: Response) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;
  
  // Get token from query or header
  const token = req.query.token as string || req.headers.authorization?.split(' ')[1];
  const courseId = req.query.courseId as string; // Optional courseId for repo linking
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required in URL (?token=xxx)' });
  }

  try {
    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    // Include courseId in state if provided
    const state = courseId 
      ? `${decoded.userId}:${courseId}:${token}` 
      : `${decoded.userId}::${token}`;

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(callbackUrl!)}&scope=user:email,read:user&state=${encodeURIComponent(state)}`;

    res.redirect(githubAuthUrl);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid access token' });
  }
});

// GitHub OAuth - Callback
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=github_auth_failed`);
    return;
  }

  try {
    // Parse state to get user ID and courseId
    const [userIdStr, courseIdStr] = (state as string).split(':');
    const userId = parseInt(userIdStr);
    const courseId = courseIdStr ? parseInt(courseIdStr) : null;

    if (!userId) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=invalid_state`);
      return;
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=github_token_failed`);
      return;
    }

    // Get GitHub user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Update user with GitHub info
    await prisma.user.update({
      where: { id: userId },
      data: {
        githubId: githubUser.id.toString(),
        githubUsername: githubUser.login,
      },
    });

    // Get GitHub App installation URL from env
    const githubAppId = process.env.GITHUB_APP_ID;
    const githubAppSlug = process.env.GITHUB_APP_SLUG; // e.g., 'pr-management-1'
    
    // Redirect to GitHub App installation page with state
    if (githubAppId || githubAppSlug) {
      // Create state with userId and courseId for installation callback
      const installState = courseId ? `${userId}:${courseId}` : `${userId}`;
      const installUrl = githubAppSlug 
        ? `https://github.com/apps/${githubAppSlug}/installations/new?state=${encodeURIComponent(installState)}`
        : `https://github.com/apps/install/${githubAppId}?state=${encodeURIComponent(installState)}`;
      
      res.redirect(installUrl);
    } else {
      // Fallback: redirect to frontend with success
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?github_connected=true`);
    }
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=github_auth_failed`);
  }
});

// Disconnect GitHub account
router.post('/github/disconnect', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        githubId: null,
        githubUsername: null,
      },
    });

    res.json({ success: true, message: 'GitHub account disconnected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect GitHub account' });
  }
});

// GitHub App Installation Callback
router.get('/github/app-callback', async (req: Request, res: Response) => {
  const { installation_id, setup_action, state } = req.query;

  if (!installation_id || !state) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=installation_failed`);
    return;
  }

  try {
    // Parse state to get userId and courseId
    const [userIdStr, courseIdStr] = (state as string).split(':');
    const userId = parseInt(userIdStr);
    const courseId = courseIdStr ? parseInt(courseIdStr) : null;

    if (!userId) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=invalid_state`);
      return;
    }

    // Get installation details from GitHub
    const installationToken = await getInstallationToken(installation_id as string);
    
    if (installationToken) {
      const reposResponse = await axios.get('https://api.github.com/installation/repositories', {
        headers: { 
          Authorization: `Bearer ${installationToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
      });

      const repos = reposResponse.data.repositories;

      // If courseId is provided, link repos to the course
      if (courseId && repos.length > 0) {
        // Link all installed repos to the course as TraineeRepo
        for (const repo of repos) {
          await prisma.traineeRepo.upsert({
            where: {
              traineeId_courseId_repoName: {
                traineeId: userId,
                courseId: courseId,
                repoName: repo.full_name
              }
            },
            create: {
              traineeId: userId,
              courseId: courseId,
              repoName: repo.full_name,
              repoUrl: repo.html_url,
            },
            update: {
              repoUrl: repo.html_url,
            }
          });
        }

        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/trainee-dashboard?tab=courses&github_installed=true&courseId=${courseId}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?github_installed=true`);
      }
    } else {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=token_failed`);
    }
  } catch (error) {
    console.error('GitHub App installation callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=installation_failed`);
  }
});

// Helper function to get installation access token
async function getInstallationToken(installationId: string): Promise<string | null> {
  try {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      console.error('GitHub App credentials not configured');
      return null;
    }

    // Generate JWT for GitHub App authentication
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now,
      exp: now + 600, // 10 minutes
      iss: appId,
    };

    const appToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    // Get installation access token
    const response = await axios.post(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {},
      {
        headers: {
          Authorization: `Bearer ${appToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return response.data.token;
  } catch (error) {
    console.error('Failed to get installation token:', error);
    return null;
  }
}

// Get GitHub connection status
router.get('/github/status', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { githubId: true, githubUsername: true },
    });

    res.json({
      connected: !!user?.githubId,
      githubUsername: user?.githubUsername || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get GitHub status' });
  }
});

export default router;
