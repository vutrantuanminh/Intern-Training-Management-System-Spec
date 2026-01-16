import express from 'express';
import { githubWebhookHandler } from './githubWebhook';
import { githubAppWebhookHandler } from './githubAppWebhook';
import { courseRepoController, githubPRController, traineeRepoController } from './githubPRController';
import * as pullRequestController from './pullRequestController';

const router = express.Router();

// GitHub App webhook endpoint (new)
router.post('/github/webhook', express.json(), githubAppWebhookHandler);

// Old GitHub webhook endpoint (keep for backwards compatibility)
router.post('/github/webhook/legacy', express.json(), githubWebhookHandler);

// Course Repo Management (Admin/Supervisor)
router.post('/course-repos', courseRepoController.linkRepo);
router.get('/course-repos/:courseId', courseRepoController.getCourseRepos);
router.delete('/course-repos', courseRepoController.unlinkRepo);

// Trainee Repo Management (Trainee's personal repos)
router.post('/trainee-repos', traineeRepoController.linkRepo);
router.get('/trainee-repos/:traineeId', traineeRepoController.getReposByTrainee);
router.get('/trainee-repos/:traineeId/:courseId', traineeRepoController.getReposByCourse);
router.delete('/trainee-repos/:id', traineeRepoController.unlinkRepo);

// GitHub PR Management
router.get('/github-prs/course/:courseId', githubPRController.getPRsByCourse);
router.get('/github-prs/trainee/:traineeId', githubPRController.getPRsByTrainee);
router.get('/github-prs/trainer/:trainerId', githubPRController.getPRsByTrainer);
router.get('/github-prs/:id', githubPRController.getPRById);

// Original PR routes (keep for backwards compatibility)
// Create a new pull request
router.post('/pull-requests', pullRequestController.createPullRequest);
// Get PRs by course
router.get('/pull-requests/course/:courseId', pullRequestController.getPullRequestsByCourse);
// Get PRs by trainee
router.get('/pull-requests/trainee/:traineeId', pullRequestController.getPullRequestsByTrainee);
// Get PRs by trainer (all courses they teach)
router.get('/pull-requests/trainer/:trainerId', pullRequestController.getPullRequestsByTrainer);

export default router;
