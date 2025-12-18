import { User, Course, Subject, Task, CourseTrainee, DailyReport, PullRequest, Notification, TraineeSubject, TraineeTask } from '../types';

// Mock Users
export const mockUsers: User[] = [
  { id: 'admin1', name: 'Admin User', email: 'admin@system.com', role: 'admin', createdAt: new Date('2024-01-01') },
  { id: 'sup1', name: 'Sarah Johnson', email: 'sarah@system.com', role: 'supervisor', createdAt: new Date('2024-01-05') },
  { id: 'sup2', name: 'Michael Chen', email: 'michael@system.com', role: 'supervisor', createdAt: new Date('2024-01-10') },
  { id: 'trainer1', name: 'David Wilson', email: 'david@system.com', role: 'trainer', createdAt: new Date('2024-02-01') },
  { id: 'trainer2', name: 'Emma Rodriguez', email: 'emma@system.com', role: 'trainer', createdAt: new Date('2024-02-05') },
  { id: 'trainee1', name: 'John Smith', email: 'john@system.com', role: 'trainee', createdAt: new Date('2024-03-01') },
  { id: 'trainee2', name: 'Lisa Anderson', email: 'lisa@system.com', role: 'trainee', createdAt: new Date('2024-03-01') },
  { id: 'trainee3', name: 'Alex Turner', email: 'alex@system.com', role: 'trainee', createdAt: new Date('2024-03-05') },
  { id: 'trainee4', name: 'Maria Garcia', email: 'maria@system.com', role: 'trainee', createdAt: new Date('2024-03-10') },
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course1',
    name: 'Full Stack Web Development',
    description: 'Complete training program for modern web development',
    creatorId: 'sup1',
    trainerId: 'trainer1',
    status: 'in_progress',
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-06-15'),
    createdAt: new Date('2024-03-01')
  },
  {
    id: 'course2',
    name: 'React Advanced Patterns',
    description: 'Deep dive into React hooks, patterns, and best practices',
    creatorId: 'sup1',
    trainerId: 'trainer2',
    status: 'in_progress',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-05-30'),
    createdAt: new Date('2024-03-20')
  },
  {
    id: 'course3',
    name: 'Backend Development with Node.js',
    description: 'Master server-side development with Node.js and Express',
    creatorId: 'sup2',
    trainerId: 'trainer1',
    status: 'not_started',
    createdAt: new Date('2024-04-10')
  },
];

// Mock Subjects
export const mockSubjects: Subject[] = [
  {
    id: 'sub1',
    courseId: 'course1',
    name: 'HTML & CSS Fundamentals',
    description: 'Learn the basics of web markup and styling',
    status: 'finished',
    order: 1,
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-03-25')
  },
  {
    id: 'sub2',
    courseId: 'course1',
    name: 'JavaScript Basics',
    description: 'Introduction to JavaScript programming',
    status: 'in_progress',
    order: 2,
    startDate: new Date('2024-03-26')
  },
  {
    id: 'sub3',
    courseId: 'course1',
    name: 'React Framework',
    description: 'Build modern UIs with React',
    status: 'not_started',
    order: 3
  },
  {
    id: 'sub4',
    courseId: 'course2',
    name: 'React Hooks Deep Dive',
    description: 'Master useState, useEffect, and custom hooks',
    status: 'in_progress',
    order: 1,
    startDate: new Date('2024-04-01')
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  { id: 'task1', subjectId: 'sub1', name: 'Create a personal portfolio page', description: 'Build a responsive portfolio using HTML and CSS', order: 1 },
  { id: 'task2', subjectId: 'sub1', name: 'CSS Grid Layout Exercise', description: 'Create a complex layout using CSS Grid', order: 2 },
  { id: 'task3', subjectId: 'sub2', name: 'JavaScript Variables and Data Types', description: 'Practice working with different data types', order: 1 },
  { id: 'task4', subjectId: 'sub2', name: 'DOM Manipulation Project', description: 'Build an interactive to-do list', order: 2 },
  { id: 'task5', subjectId: 'sub2', name: 'Async JavaScript with Promises', description: 'Fetch data from an API', order: 3 },
  { id: 'task6', subjectId: 'sub4', name: 'useState Hook Practice', description: 'Build a counter and form with useState', order: 1 },
  { id: 'task7', subjectId: 'sub4', name: 'useEffect for Side Effects', description: 'Implement data fetching with useEffect', order: 2 },
];

// Mock Course Trainees
export const mockCourseTrainees: CourseTrainee[] = [
  { id: 'ct1', courseId: 'course1', traineeId: 'trainee1', status: 'active', enrolledAt: new Date('2024-03-15') },
  { id: 'ct2', courseId: 'course1', traineeId: 'trainee2', status: 'active', enrolledAt: new Date('2024-03-15') },
  { id: 'ct3', courseId: 'course1', traineeId: 'trainee3', status: 'active', enrolledAt: new Date('2024-03-15') },
  { id: 'ct4', courseId: 'course2', traineeId: 'trainee2', status: 'active', enrolledAt: new Date('2024-04-01') },
  { id: 'ct5', courseId: 'course2', traineeId: 'trainee4', status: 'active', enrolledAt: new Date('2024-04-01') },
];

// Mock Trainee Subjects
export const mockTraineeSubjects: TraineeSubject[] = [
  { id: 'ts1', traineeId: 'trainee1', subjectId: 'sub1', status: 'finished', grade: 95, feedback: 'Excellent work!', completedAt: new Date('2024-03-25') },
  { id: 'ts2', traineeId: 'trainee1', subjectId: 'sub2', status: 'in_progress' },
  { id: 'ts3', traineeId: 'trainee2', subjectId: 'sub1', status: 'finished', grade: 88, feedback: 'Good progress', completedAt: new Date('2024-03-25') },
  { id: 'ts4', traineeId: 'trainee2', subjectId: 'sub2', status: 'in_progress' },
  { id: 'ts5', traineeId: 'trainee2', subjectId: 'sub4', status: 'in_progress' },
];

// Mock Trainee Tasks
export const mockTraineeTasks: TraineeTask[] = [
  { id: 'tt1', traineeId: 'trainee1', taskId: 'task1', status: 'completed', evidenceFiles: ['portfolio.zip'], completedAt: new Date('2024-03-20') },
  { id: 'tt2', traineeId: 'trainee1', taskId: 'task2', status: 'completed', evidenceFiles: ['grid-layout.zip'], completedAt: new Date('2024-03-24') },
  { id: 'tt3', traineeId: 'trainee1', taskId: 'task3', status: 'completed', evidenceFiles: ['variables.js'], completedAt: new Date('2024-04-01') },
  { id: 'tt4', traineeId: 'trainee1', taskId: 'task4', status: 'in_progress', evidenceFiles: [] },
  { id: 'tt5', traineeId: 'trainee2', taskId: 'task1', status: 'completed', evidenceFiles: ['my-portfolio.zip'], completedAt: new Date('2024-03-21') },
  { id: 'tt6', traineeId: 'trainee2', taskId: 'task6', status: 'in_progress', evidenceFiles: [] },
];

// Mock Daily Reports
export const mockDailyReports: DailyReport[] = [
  {
    id: 'dr1',
    traineeId: 'trainee1',
    courseId: 'course1',
    date: new Date('2024-04-10'),
    content: 'Completed DOM manipulation exercises. Created an interactive to-do list with add, delete, and filter functionality.',
    tasksCompleted: ['task3'],
    createdAt: new Date('2024-04-10')
  },
  {
    id: 'dr2',
    traineeId: 'trainee1',
    courseId: 'course1',
    date: new Date('2024-04-11'),
    content: 'Started working on async JavaScript. Practiced with Promises and fetch API.',
    tasksCompleted: [],
    createdAt: new Date('2024-04-11')
  },
  {
    id: 'dr3',
    traineeId: 'trainee2',
    courseId: 'course1',
    date: new Date('2024-04-10'),
    content: 'Finished portfolio page with responsive design. Added contact form.',
    tasksCompleted: ['task1'],
    createdAt: new Date('2024-04-10')
  },
];

// Mock Pull Requests
export const mockPullRequests: PullRequest[] = [
  {
    id: 'pr1',
    traineeId: 'trainee1',
    taskId: 'task1',
    title: 'Personal Portfolio - Initial Version',
    description: 'Created responsive portfolio with home, about, and projects sections',
    url: 'https://github.com/trainee1/portfolio/pull/1',
    status: 'approved',
    feedback: 'Great work! Clean code and nice design.',
    createdAt: new Date('2024-03-20'),
    reviewedAt: new Date('2024-03-21'),
    reviewerId: 'trainer1'
  },
  {
    id: 'pr2',
    traineeId: 'trainee1',
    taskId: 'task4',
    title: 'Interactive To-Do List',
    description: 'Implemented CRUD operations for to-do items with local storage',
    url: 'https://github.com/trainee1/todo-app/pull/1',
    status: 'pending',
    createdAt: new Date('2024-04-12')
  },
  {
    id: 'pr3',
    traineeId: 'trainee2',
    taskId: 'task6',
    title: 'React Hooks Practice - Counter and Form',
    description: 'Built reusable counter component and controlled form inputs',
    url: 'https://github.com/trainee2/hooks-practice/pull/1',
    status: 'pending',
    createdAt: new Date('2024-04-13')
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'trainer1',
    type: 'pr',
    title: 'New Pull Request',
    message: 'John Smith submitted a pull request for "Interactive To-Do List"',
    isRead: false,
    createdAt: new Date('2024-04-12'),
    linkTo: '/pull-requests/pr2'
  },
  {
    id: 'notif2',
    userId: 'trainer2',
    type: 'pr',
    title: 'New Pull Request',
    message: 'Lisa Anderson submitted a pull request for "React Hooks Practice"',
    isRead: false,
    createdAt: new Date('2024-04-13'),
    linkTo: '/pull-requests/pr3'
  },
  {
    id: 'notif3',
    userId: 'trainee1',
    type: 'pr',
    title: 'Pull Request Approved',
    message: 'Your pull request "Personal Portfolio" has been approved',
    isRead: true,
    createdAt: new Date('2024-03-21')
  },
];
