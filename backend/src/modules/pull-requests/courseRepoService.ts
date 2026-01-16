import { prisma } from '../../config/database';

export const courseRepoService = {
  // Link a repo to a course
  async linkRepoToCourse(courseId: number, repoName: string, repoUrl: string) {
    return prisma.courseRepo.upsert({
      where: {
        courseId_repoName: {
          courseId,
          repoName,
        },
      },
      update: {
        repoUrl,
      },
      create: {
        courseId,
        repoName,
        repoUrl,
      },
    });
  },

  // Get all repos for a course
  async getReposByCourse(courseId: number) {
    return prisma.courseRepo.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Find course by repo name
  async findCourseByRepo(repoName: string) {
    const courseRepo = await prisma.courseRepo.findFirst({
      where: { repoName },
      include: { course: true },
    });
    return courseRepo?.course || null;
  },

  // Remove repo from course
  async unlinkRepoFromCourse(courseId: number, repoName: string) {
    return prisma.courseRepo.deleteMany({
      where: {
        courseId,
        repoName,
      },
    });
  },

  // Get all courses for a repo
  async getCoursesByRepo(repoName: string) {
    return prisma.courseRepo.findMany({
      where: { repoName },
      include: { course: true },
    });
  },
};
