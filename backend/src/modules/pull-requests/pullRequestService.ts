import { prisma } from '../../config/database';

export const createPullRequest = async ({
  traineeId,
  courseId,
  taskId,
  title,
  description,
  repoUrl,
}: {
  traineeId: number;
  courseId: number;
  taskId?: number;
  title: string;
  description?: string;
  repoUrl: string;
}) => {
  return prisma.pullRequest.create({
    data: {
      traineeId,
      courseId,
      taskId,
      title,
      description,
      repoUrl,
    },
  });
};

export const getPullRequestsByCourse = async (courseId: number) => {
  return prisma.pullRequest.findMany({
    where: { courseId },
    include: { trainee: true, reviewer: true, task: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const getPullRequestsByTrainee = async (traineeId: number) => {
  return prisma.pullRequest.findMany({
    where: { traineeId },
    include: { course: true, reviewer: true, task: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const getPullRequestsByTrainerCourses = async (trainerId: number) => {
  // Find all courses for this trainer
  const courses = await prisma.courseTrainer.findMany({
    where: { trainerId },
    select: { courseId: true },
  });
  const courseIds = courses.map((c: { courseId: number }) => c.courseId);
  return prisma.pullRequest.findMany({
    where: { courseId: { in: courseIds } },
    include: { trainee: true, reviewer: true, task: true },
    orderBy: { createdAt: 'desc' },
  });
};
