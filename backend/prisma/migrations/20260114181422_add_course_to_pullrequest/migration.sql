/*
  Warnings:

  - Added the required column `courseId` to the `PullRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PullRequest" ADD COLUMN     "courseId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "PullRequest_courseId_idx" ON "PullRequest"("courseId");

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
