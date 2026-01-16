import { prisma } from '../../config/database';

export const traineeRepoService = {
  // Link trainee's personal repo to a course
  async linkRepo(traineeId: number, courseId: number, repoName: string, repoUrl?: string) {
    return prisma.traineeRepo.create({
      data: {
        traineeId,
        courseId,
        repoName,
        repoUrl: repoUrl || `https://github.com/${repoName}`,
      },
    });
  },

  // Get trainee's repos for a specific course
  async getReposByCourse(traineeId: number, courseId: number) {
    return prisma.traineeRepo.findMany({
      where: { traineeId, courseId },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get all trainee's repos
  async getReposByTrainee(traineeId: number) {
    return prisma.traineeRepo.findMany({
      where: { traineeId },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Find course by repo name (check both CourseRepo and TraineeRepo)
  async findCourseByRepo(repoName: string, traineeId?: number) {
    // First check CourseRepo
    const courseRepo = await prisma.courseRepo.findFirst({
      where: { repoName },
      select: { courseId: true },
    });

    if (courseRepo) {
      return courseRepo.courseId;
    }

    // If traineeId provided, check TraineeRepo
    if (traineeId) {
      const traineeRepo = await prisma.traineeRepo.findFirst({
        where: { repoName, traineeId },
        select: { courseId: true },
      });

      return traineeRepo?.courseId || null;
    }

    return null;
  },

  // Unlink repo
  async unlinkRepo(id: number, traineeId: number) {
    return prisma.traineeRepo.delete({
      where: { id, traineeId },
    });
  },
};
