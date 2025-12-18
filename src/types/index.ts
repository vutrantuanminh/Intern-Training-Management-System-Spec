export type UserRole = 'admin' | 'supervisor' | 'trainer' | 'trainee';
export type CourseStatus = 'not_started' | 'in_progress' | 'finished';
export type SubjectStatus = 'not_started' | 'in_progress' | 'finished';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type TraineeStatus = 'active' | 'pass' | 'fail' | 'resign';
export type PRStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  trainerId?: string;
  status: CourseStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface Subject {
  id: string;
  courseId: string;
  name: string;
  description: string;
  status: SubjectStatus;
  order: number;
  startDate?: Date;
  endDate?: Date;
}

export interface Task {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  order: number;
}

export interface TraineeSubject {
  id: string;
  traineeId: string;
  subjectId: string;
  status: SubjectStatus;
  grade?: number;
  feedback?: string;
  completedAt?: Date;
}

export interface TraineeTask {
  id: string;
  traineeId: string;
  taskId: string;
  status: TaskStatus;
  evidenceFiles: string[];
  completedAt?: Date;
}

export interface CourseTrainee {
  id: string;
  courseId: string;
  traineeId: string;
  status: TraineeStatus;
  enrolledAt: Date;
}

export interface DailyReport {
  id: string;
  traineeId: string;
  courseId: string;
  date: Date;
  content: string;
  tasksCompleted: string[];
  createdAt: Date;
}

export interface PullRequest {
  id: string;
  traineeId: string;
  taskId: string;
  title: string;
  description: string;
  url: string;
  status: PRStatus;
  feedback?: string;
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  conversationId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  name?: string;
  participants: string[];
  courseId?: string;
  subjectId?: string;
  lastMessage?: ChatMessage;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'course' | 'subject' | 'task' | 'pr' | 'chat' | 'report';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  linkTo?: string;
}
