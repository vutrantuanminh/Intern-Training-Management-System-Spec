/*
  Warnings:

  - A unique constraint covering the columns `[githubId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prNumber` to the `PullRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prUrl` to the `PullRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repoName` to the `PullRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PullRequest" ADD COLUMN     "githubUserId" TEXT,
ADD COLUMN     "prNumber" INTEGER NOT NULL,
ADD COLUMN     "prUrl" TEXT NOT NULL,
ADD COLUMN     "repoName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubId" TEXT,
ADD COLUMN     "githubUsername" TEXT;

-- CreateTable
CREATE TABLE "CourseRepo" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "repoName" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRepo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseRepo_repoName_idx" ON "CourseRepo"("repoName");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRepo_courseId_repoName_key" ON "CourseRepo"("courseId", "repoName");

-- CreateIndex
CREATE INDEX "PullRequest_repoName_idx" ON "PullRequest"("repoName");

-- CreateIndex
CREATE INDEX "PullRequest_prNumber_idx" ON "PullRequest"("prNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE INDEX "User_githubId_idx" ON "User"("githubId");

-- AddForeignKey
ALTER TABLE "CourseRepo" ADD CONSTRAINT "CourseRepo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
