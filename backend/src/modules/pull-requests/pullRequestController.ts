import { Request, Response } from 'express';
import * as pullRequestService from './pullRequestService';

export const createPullRequest = async (req: Request, res: Response) => {
  try {
    const { traineeId, courseId, taskId, title, description, repoUrl } = req.body;
    const pr = await pullRequestService.createPullRequest({
      traineeId,
      courseId,
      taskId,
      title,
      description,
      repoUrl,
    });
    res.status(201).json(pr);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create pull request', details: err });
  }
};

export const getPullRequestsByCourse = async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    const prs = await pullRequestService.getPullRequestsByCourse(courseId);
    res.json(prs);
  } catch (err) {
    res.status(400).json({ error: 'Failed to fetch pull requests', details: err });
  }
};

export const getPullRequestsByTrainee = async (req: Request, res: Response) => {
  try {
    const traineeId = Number(req.params.traineeId);
    const prs = await pullRequestService.getPullRequestsByTrainee(traineeId);
    res.json(prs);
  } catch (err) {
    res.status(400).json({ error: 'Failed to fetch pull requests', details: err });
  }
};

export const getPullRequestsByTrainer = async (req: Request, res: Response) => {
  try {
    const trainerId = Number(req.params.trainerId);
    const prs = await pullRequestService.getPullRequestsByTrainerCourses(trainerId);
    res.json(prs);
  } catch (err) {
    res.status(400).json({ error: 'Failed to fetch pull requests', details: err });
  }
};
