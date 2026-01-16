-- CreateTable
CREATE TABLE "TraineeRepo" (
    "id" SERIAL NOT NULL,
    "traineeId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "repoName" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraineeRepo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TraineeRepo_traineeId_idx" ON "TraineeRepo"("traineeId");

-- CreateIndex
CREATE INDEX "TraineeRepo_courseId_idx" ON "TraineeRepo"("courseId");

-- CreateIndex
CREATE INDEX "TraineeRepo_repoName_idx" ON "TraineeRepo"("repoName");

-- CreateIndex
CREATE UNIQUE INDEX "TraineeRepo_traineeId_courseId_repoName_key" ON "TraineeRepo"("traineeId", "courseId", "repoName");

-- AddForeignKey
ALTER TABLE "TraineeRepo" ADD CONSTRAINT "TraineeRepo_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraineeRepo" ADD CONSTRAINT "TraineeRepo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
