import { Request, Response } from 'express';
import { courseRepoService } from './courseRepoService';
import { traineeRepoService } from './traineeRepoService';
import { prisma } from '../../config/database';

export const courseRepoController = {
  // Link a repo to a course (Admin/Supervisor only)
  async linkRepo(req: Request, res: Response) {
    try {
      const { courseId, repoName, repoUrl } = req.body;

      if (!courseId || !repoName || !repoUrl) {
        res.status(400).json({ error: 'courseId, repoName, and repoUrl are required' });
        return;
      }

      const courseRepo = await courseRepoService.linkRepoToCourse(courseId, repoName, repoUrl);
      res.status(201).json(courseRepo);
    } catch (err) {
      res.status(400).json({ error: 'Failed to link repo to course', details: err });
    }
  },

  // Get all repos for a course
  async getCourseRepos(req: Request, res: Response) {
    try {
      const courseId = Number(req.params.courseId);
      const repos = await courseRepoService.getReposByCourse(courseId);
      res.json(repos);
    } catch (err) {
      res.status(400).json({ error: 'Failed to fetch course repos', details: err });
    }
  },

  // Unlink a repo from a course
  async unlinkRepo(req: Request, res: Response) {
    try {
      const { courseId, repoName } = req.body;

      if (!courseId || !repoName) {
        res.status(400).json({ error: 'courseId and repoName are required' });
        return;
      }

      await courseRepoService.unlinkRepoFromCourse(courseId, repoName);
      res.json({ message: 'Repo unlinked successfully' });
    } catch (err) {
      res.status(400).json({ error: 'Failed to unlink repo', details: err });
    }
  },
};

export const githubPRController = {
  // Get all PRs for a course (for trainers)
  async getPRsByCourse(req: Request, res: Response) {
    try {
      const courseId = Number(req.params.courseId);
      const prs = await prisma.pullRequest.findMany({
        where: { courseId },
        include: {
          trainee: { select: { id: true, fullName: true, email: true } },
          course: { select: { id: true, title: true } },
          reviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(prs);
    } catch (err) {
      res.status(400).json({ error: 'Failed to fetch PRs', details: err });
    }
  },

  // Get all PRs for a trainee
  async getPRsByTrainee(req: Request, res: Response) {
    try {
      const traineeId = Number(req.params.traineeId);
      const prs = await prisma.pullRequest.findMany({
        where: { traineeId },
        include: {
          course: { select: { id: true, title: true } },
          reviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(prs);
    } catch (err) {
      res.status(400).json({ error: 'Failed to fetch PRs', details: err });
    }
  },

  // Get all PRs for all courses a trainer manages
  async getPRsByTrainer(req: Request, res: Response) {
    try {
      const trainerId = Number(req.params.trainerId);

      // Find all courses for this trainer
      const courses = await prisma.courseTrainer.findMany({
        where: { trainerId },
        select: { courseId: true },
      });
      const courseIds = courses.map((c) => c.courseId);

      const prs = await prisma.pullRequest.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          trainee: { select: { id: true, fullName: true, email: true } },
          course: { select: { id: true, title: true } },
          reviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(prs);
    } catch (err) {
      res.status(400).json({ error: 'Failed to fetch PRs', details: err });
    }
  },

  // Get single PR details
  async getPRById(req: Request, res: Response) {
    try {
      const prId = Number(req.params.id);
      const pr = await prisma.pullRequest.findUnique({
        where: { id: prId },
        include: {
          trainee: { select: { id: true, fullName: true, email: true, githubUsername: true } },
          course: { select: { id: true, title: true } },
          reviewer: { select: { id: true, fullName: true } },
          comments: {
            include: {
              user: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!pr) {
        res.status(404).json({ error: 'Pull request not found' });
        return;
      }

      res.json(pr);
    } catch (err) {
      res.status(400).json({ error: 'Failed to fetch PR', details: err });
    }
  },
};

export const traineeRepoController = {
  // Link trainee's personal repo to a course
  async linkRepo(req: Request, res: Response) {
    try {
      const { traineeId, courseId, repoName, repoUrl } = req.body;

      if (!traineeId || !courseId || !repoName) {
        res.status(400).json({ error: 'traineeId, courseId, and repoName are required' });
        return;
      }

      const traineeRepo = await traineeRepoService.linkRepo(traineeId, courseId, repoName, repoUrl);
      res.status(201).json(traineeRepo);
    } catch (err) {
      res.status(400).json({ error: 'Failed to link repo', details: err });
    }
  },

  // Get all repos for a trainee
  async getReposByTrainee(req: Request, res: Response) {
    try {
      const traineeId = Number(req.params.traineeId);
      const repos = await traineeRepoService.getReposByTrainee(traineeId);
      res.json(repos);
    } catch (err) {
      res.status(400).json({ error: 'Failed to fetch trainee repos', details: err });
    }
  },

  // Get trainee's repos for a specific course
  async getReposByCourse(req: Request, res: Response) {
    try {
      const traineeId = Number(req.params.traineeId);
      const courseId = Number(req.params.courseId);
      const repos = await traineeRepoService.getReposByCourse(traineeId, courseId);
      res.json(repos);
    } catch (err) {
      res.status(400).json({ error: 'Failed to fetch trainee course repos', details: err });
    }
  },

  // Unlink trainee's repo
  async unlinkRepo(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      // Lấy traineeId từ query string thay vì body
      const traineeId = Number(req.query.traineeId);

      if (!traineeId) {
        res.status(400).json({ error: 'traineeId is required' });
        return;
      }

      await traineeRepoService.unlinkRepo(id, traineeId);
      res.json({ message: 'Repo unlinked successfully' });
    } catch (err) {
      res.status(400).json({ error: 'Failed to unlink repo', details: err });
    }
  },
};
