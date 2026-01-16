import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with comprehensive data...\n');

    // Create roles
    const roles = await Promise.all([
        prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
        prisma.role.upsert({ where: { name: 'SUPERVISOR' }, update: {}, create: { name: 'SUPERVISOR' } }),
        prisma.role.upsert({ where: { name: 'TRAINER' }, update: {}, create: { name: 'TRAINER' } }),
        prisma.role.upsert({ where: { name: 'TRAINEE' }, update: {}, create: { name: 'TRAINEE' } }),
    ]);
    console.log('✅ Roles created:', roles.map(r => r.name).join(', '));

    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    const getRoleId = (name: string) => roles.find(r => r.name === name)!.id;

    // ============ USERS ============

    // Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@tms.com' },
        update: {},
        create: {
            email: 'admin@tms.com',
            password: hashedPassword,
            fullName: 'System Administrator',
            isEmailVerified: true,
            githubId: null,
            githubUsername: null,
            roles: { create: { roleId: getRoleId('ADMIN') } },
        },
    });
    console.log('✅ Admin created');

    // 3 Supervisors
    const supervisorData = [
        { email: 'supervisor@tms.com', fullName: 'Sarah Johnson' },
        { email: 'supervisor2@tms.com', fullName: 'Michael Chen' },
        { email: 'supervisor3@tms.com', fullName: 'Emily Davis' },
    ];
    const supervisors = await Promise.all(
        supervisorData.map(data =>
            prisma.user.upsert({
                where: { email: data.email },
                update: {},
                create: {
                    ...data,
                    password: hashedPassword,
                    isEmailVerified: true,
                    githubId: null,
                    githubUsername: null,
                    roles: { create: { roleId: getRoleId('SUPERVISOR') } },
                },
            })
        )
    );
    console.log('✅ 3 Supervisors created');

    // 5 Trainers
    const trainerData = [
        { email: 'trainer@tms.com', fullName: 'David Wilson' },
        { email: 'trainer2@tms.com', fullName: 'Anna Martinez' },
        { email: 'trainer3@tms.com', fullName: 'James Brown' },
        { email: 'trainer4@tms.com', fullName: 'Sophie Turner' },
        { email: 'trainer5@tms.com', fullName: 'Chris Evans' },
    ];
    const trainers = await Promise.all(
        trainerData.map(data =>
            prisma.user.upsert({
                where: { email: data.email },
                update: {},
                create: {
                    ...data,
                    password: hashedPassword,
                    isEmailVerified: true,
                    githubId: null,
                    githubUsername: null,
                    roles: { create: { roleId: getRoleId('TRAINER') } },
                },
            })
        )
    );
    console.log('✅ 5 Trainers created');

    // 15 Trainees
    const traineeNames = [
        'John Smith', 'Lisa Anderson', 'Mike Thompson', 'Emma Wilson', 'Ryan Garcia',
        'Olivia Martinez', 'Ethan Lee', 'Ava Taylor', 'Noah Hernandez', 'Mia Robinson',
        'Lucas Clark', 'Sophia Lewis', 'Mason Hall', 'Isabella Young', 'Aiden King',
    ];
    const trainees = await Promise.all(
        traineeNames.map((name, i) =>
            prisma.user.upsert({
                where: { email: `trainee${i + 1}@tms.com` },
                update: {},
                create: {
                    email: `trainee${i + 1}@tms.com`,
                    fullName: name,
                    password: hashedPassword,
                    isEmailVerified: true,
                    githubId: null,
                    githubUsername: null,
                    roles: { create: { roleId: getRoleId('TRAINEE') } },
                },
            })
        )
    );
    console.log('✅ 15 Trainees created');

    // ============ COURSES ============

    // Course 1: Full Stack Web Development (IN_PROGRESS)
    const course1 = await prisma.course.create({
        data: {
            title: 'Full Stack Web Development',
            description: 'Complete training program for modern web development covering HTML, CSS, JavaScript, React, Node.js, and databases.',
            status: 'IN_PROGRESS',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            createdById: supervisors[0].id,
            trainers: { create: [{ trainerId: trainers[0].id }, { trainerId: trainers[1].id }] },
            subjects: {
                create: [
                    {
                        title: 'HTML & CSS Fundamentals',
                        description: 'Learn modern HTML5 and CSS3, responsive design, Flexbox and Grid',
                        status: 'FINISHED',
                        order: 1,
                        startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
                        tasks: {
                            create: [
                                { title: 'Personal Portfolio Page', description: 'Build a responsive portfolio using HTML and CSS', order: 1 },
                                { title: 'CSS Grid Layout', description: 'Create a complex magazine-style layout using CSS Grid', order: 2 },
                                { title: 'Responsive Navigation', description: 'Build a mobile-first navigation menu', order: 3 },
                            ],
                        },
                    },
                    {
                        title: 'JavaScript Fundamentals',
                        description: 'Core JavaScript concepts: variables, functions, DOM, async programming',
                        status: 'IN_PROGRESS',
                        order: 2,
                        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                        tasks: {
                            create: [
                                { title: 'Variables and Data Types', description: 'Practice with different data types', order: 1 },
                                { title: 'Functions and Scope', description: 'Master function declarations, expressions, and scope', order: 2 },
                                { title: 'DOM Manipulation', description: 'Build an interactive to-do list', order: 3 },
                                { title: 'Async JavaScript', description: 'Fetch data from APIs using Promises and async/await', order: 4 },
                            ],
                        },
                    },
                    {
                        title: 'React Development',
                        description: 'Build modern UIs with React hooks, state management, and component patterns',
                        status: 'NOT_STARTED',
                        order: 3,
                        tasks: {
                            create: [
                                { title: 'React Components', description: 'Create reusable components', order: 1 },
                                { title: 'State and Props', description: 'Manage component state', order: 2 },
                                { title: 'React Hooks', description: 'Use useState, useEffect, and custom hooks', order: 3 },
                                { title: 'Final Project', description: 'Build a full React application', order: 4 },
                            ],
                        },
                    },
                    {
                        title: 'Node.js Backend',
                        description: 'Server-side JavaScript with Express, REST APIs, and databases',
                        status: 'NOT_STARTED',
                        order: 4,
                        tasks: {
                            create: [
                                { title: 'Express Basics', description: 'Create your first Express server', order: 1 },
                                { title: 'REST API Design', description: 'Build a CRUD API', order: 2 },
                                { title: 'Database Integration', description: 'Connect to PostgreSQL with Prisma', order: 3 },
                                { title: 'Authentication', description: 'Implement JWT authentication', order: 4 },
                            ],
                        },
                    },
                ],
            },
        },
    });
    console.log('✅ Course 1 created: Full Stack Web Development');

    // Course 2: Python Data Science (IN_PROGRESS)
    const course2 = await prisma.course.create({
        data: {
            title: 'Python Data Science',
            description: 'Learn data analysis, visualization, and machine learning with Python',
            status: 'IN_PROGRESS',
            startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            createdById: supervisors[1].id,
            trainers: { create: [{ trainerId: trainers[2].id }] },
            subjects: {
                create: [
                    {
                        title: 'Python Basics',
                        description: 'Python syntax, data structures, and OOP',
                        status: 'FINISHED',
                        order: 1,
                        startDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                        tasks: {
                            create: [
                                { title: 'Python Installation', description: 'Setup development environment', order: 1 },
                                { title: 'Data Structures', description: 'Lists, dictionaries, sets', order: 2 },
                            ],
                        },
                    },
                    {
                        title: 'Data Analysis with Pandas',
                        description: 'Data manipulation and analysis using Pandas',
                        status: 'IN_PROGRESS',
                        order: 2,
                        startDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
                        tasks: {
                            create: [
                                { title: 'DataFrames', description: 'Working with DataFrames', order: 1 },
                                { title: 'Data Cleaning', description: 'Handle missing data', order: 2 },
                            ],
                        },
                    },
                    {
                        title: 'Machine Learning',
                        description: 'Introduction to ML with scikit-learn',
                        status: 'NOT_STARTED',
                        order: 3,
                        tasks: {
                            create: [
                                { title: 'Linear Regression', description: 'Build your first ML model', order: 1 },
                                { title: 'Classification', description: 'Logistic regression and decision trees', order: 2 },
                            ],
                        },
                    },
                ],
            },
        },
    });
    console.log('✅ Course 2 created: Python Data Science');

    // Course 3: DevOps Fundamentals (NOT_STARTED)
    const course3 = await prisma.course.create({
        data: {
            title: 'DevOps Fundamentals',
            description: 'CI/CD, Docker, Kubernetes, and cloud deployment',
            status: 'NOT_STARTED',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: supervisors[2].id,
            trainers: { create: [{ trainerId: trainers[3].id }, { trainerId: trainers[4].id }] },
            subjects: {
                create: [
                    { title: 'Docker Basics', description: 'Containerization fundamentals', order: 1, status: 'NOT_STARTED' },
                    { title: 'Kubernetes', description: 'Container orchestration', order: 2, status: 'NOT_STARTED' },
                    { title: 'CI/CD Pipelines', description: 'Automated testing and deployment', order: 3, status: 'NOT_STARTED' },
                ],
            },
        },
    });
    console.log('✅ Course 3 created: DevOps Fundamentals');

    // Course 4: Completed course
    const course4 = await prisma.course.create({
        data: {
            title: 'Git & Version Control',
            description: 'Master Git workflows and collaboration',
            status: 'FINISHED',
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            createdById: supervisors[0].id,
            trainers: { create: [{ trainerId: trainers[0].id }] },
            subjects: {
                create: [
                    { title: 'Git Basics', description: 'Commits, branches, merging', order: 1, status: 'FINISHED' },
                    { title: 'Git Workflows', description: 'GitFlow, GitHub Flow', order: 2, status: 'FINISHED' },
                ],
            },
        },
    });
    console.log('✅ Course 4 created: Git & Version Control');

    // ============ ENROLL TRAINEES ============

    const allSubjects = await prisma.subject.findMany({ include: { tasks: true } });
    const allTasks = await prisma.task.findMany();

    // Enroll trainees in Course 1: 8 trainees
    for (let i = 0; i < 8; i++) {
        await enrollTrainee(trainees[i], course1, allSubjects.filter(s => s.courseId === course1.id), allTasks, false, i);
    }
    // Course 2: 5 trainees
    for (let i = 3; i < 8; i++) {
        await enrollTrainee(trainees[i], course2, allSubjects.filter(s => s.courseId === course2.id), allTasks, false, i - 3);
    }
    // Course 3: 6 trainees
    for (let i = 9; i < 15; i++) {
        await enrollTrainee(trainees[i], course3, allSubjects.filter(s => s.courseId === course3.id), allTasks, false, i - 9);
    }
    // Course 4 (completed): 4 trainees
    for (let i = 0; i < 4; i++) {
        await enrollTrainee(trainees[i], course4, allSubjects.filter(s => s.courseId === course4.id), allTasks, true, i);
    }

    console.log('✅ Trainees enrolled in courses');

    // ============ DAILY REPORTS ============

    for (let i = 0; i < 8; i++) {
        for (let day = 1; day <= 5; day++) {
            const reportDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
            reportDate.setHours(0, 0, 0, 0);

            await prisma.dailyReport.upsert({
                where: {
                    traineeId_date: {
                        traineeId: trainees[i].id,
                        date: reportDate,
                    }
                },
                update: {},
                create: {
                    traineeId: trainees[i].id,
                    date: reportDate,
                    content: `## Tasks Completed\n- Completed ${day} tasks for JavaScript module\n- Reviewed code with mentor\n\n## Tomorrow's Plan\n- Continue with ${day + 1} more tasks\n\n## Blockers\n${day % 3 === 0 ? '- Need clarification on async/await concepts' : 'None'}`,
                },
            });
        }
    }
    console.log('✅ Daily reports created');

    // ============ PULL REQUESTS ============

    const prData = [
        { title: 'Add user authentication', description: 'Implement JWT-based authentication', status: 'APPROVED' as const, courseId: course1.id },
        { title: 'Fix CSS responsive issues', description: 'Mobile layout fixes', status: 'APPROVED' as const, courseId: course1.id },
        { title: 'Implement shopping cart', description: 'Add to cart functionality', status: 'PENDING' as const, courseId: course1.id },
        { title: 'Database optimization', description: 'Add indexes for faster queries', status: 'PENDING' as const, courseId: course2.id },
        { title: 'Add unit tests', description: 'Test coverage for utils', status: 'REJECTED' as const, courseId: course2.id },
        { title: 'Refactor API endpoints', description: 'RESTful improvements', status: 'PENDING' as const, courseId: course1.id },
    ];

    // Create sample GitHub repos for courses
    await prisma.courseRepo.createMany({
        data: [
            { courseId: course1.id, repoName: 'training-org/fullstack-project', repoUrl: 'https://github.com/training-org/fullstack-project' },
            { courseId: course2.id, repoName: 'training-org/data-science-project', repoUrl: 'https://github.com/training-org/data-science-project' },
            { courseId: course3.id, repoName: 'training-org/devops-project', repoUrl: 'https://github.com/training-org/devops-project' },
        ],
    });
    console.log('✅ Course repos created');

    for (let i = 0; i < prData.length; i++) {
        const traineeIndex = i % 8;
        const trainee = trainees[traineeIndex];
        const repoName = prData[i].courseId === course1.id ? 'training-org/fullstack-project' : 'training-org/data-science-project';
        
        const pr = await prisma.pullRequest.create({
            data: {
                title: prData[i].title,
                description: prData[i].description,
                status: prData[i].status,
                repoUrl: `https://github.com/${repoName}`,
                prUrl: `https://github.com/${repoName}/pull/${i + 1}`,
                prNumber: i + 1,
                repoName: repoName,
                githubUserId: `github-user-${trainee.id}`,
                traineeId: trainee.id,
                courseId: prData[i].courseId,
                reviewerId: prData[i].status !== 'PENDING' ? trainers[i % 3].id : null,
                reviewedAt: prData[i].status !== 'PENDING' ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : null,
                createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
            },
        });

        // Add comments to some PRs
        if (i < 3) {
            await prisma.pRComment.create({
                data: {
                    prId: pr.id,
                    userId: trainers[0].id,
                    content: 'Great work! Just a few minor suggestions.',
                },
            });
        }
    }
    console.log('✅ 6 Pull Requests created with GitHub metadata');

    // ============ NOTIFICATIONS ============

    for (const trainee of trainees.slice(0, 5)) {
        await prisma.notification.createMany({
            data: [
                { userId: trainee.id, title: 'New task assigned', message: 'You have a new task in JavaScript module', type: 'TASK' },
                { userId: trainee.id, title: 'Report approved', message: 'Your daily report has been approved', type: 'REPORT', isRead: true },
                { userId: trainee.id, title: 'PR feedback', message: 'Your trainer left comments on your PR', type: 'PR' },
            ],
        });
    }
    console.log('✅ Notifications created');

    // ============ CHAT ROOMS ============

    const chatRoom = await prisma.chatRoom.create({
        data: {
            name: 'Full Stack Dev - General',
            isGroup: true,
            courseId: course1.id,
            members: {
                create: [
                    ...trainees.slice(0, 8).map(t => ({ userId: t.id })),
                    { userId: trainers[0].id },
                    { userId: trainers[1].id },
                ],
            },
            messages: {
                create: [
                    { senderId: trainers[0].id, content: 'Welcome to the course! Feel free to ask questions here.' },
                    { senderId: trainees[0].id, content: 'Thanks! Excited to learn!' },
                    { senderId: trainees[1].id, content: 'Can we get the schedule for this week?' },
                    { senderId: trainers[0].id, content: 'Sure, I will post it shortly.' },
                    { senderId: trainees[2].id, content: 'Is there office hours this week?' },
                    { senderId: trainers[1].id, content: 'Yes, Thursday 2-4 PM!' },
                ],
            },
        },
    });
    console.log('✅ Chat room created with messages');

    // ============ SUMMARY ============
    console.log(`
🎉 Seeding completed!

📊 Data Summary:
   - 1 Admin
   - 3 Supervisors
   - 5 Trainers
   - 15 Trainees
   - 4 Courses (1 finished, 2 in-progress, 1 not started)
   - 3 GitHub Repos linked to courses
   - 12 Subjects with 25+ Tasks
   - 40 Daily Reports
   - 6 Pull Requests with GitHub metadata
   - 15 Notifications
   - 1 Chat Room with messages

🔐 Test Accounts (Password: Admin@123):
   - Admin: admin@tms.com
   - Supervisors: supervisor@tms.com, supervisor2@tms.com, supervisor3@tms.com
   - Trainers: trainer@tms.com, trainer2@tms.com, ... trainer5@tms.com
   - Trainees: trainee1@tms.com, trainee2@tms.com, ... trainee15@tms.com
    `);
}

async function enrollTrainee(trainee: any, course: any, subjects: any[], allTasks: any[], isCompleted = false, traineeIndex = 0) {
    const ct = await prisma.courseTrainee.upsert({
        where: { courseId_traineeId: { courseId: course.id, traineeId: trainee.id } },
        update: {},
        create: {
            courseId: course.id,
            traineeId: trainee.id,
            status: isCompleted ? 'PASS' : 'ACTIVE',
        },
    });

    // Different progress levels based on trainee index
    // traineeIndex 0,1,2: high progress (70-100%)
    // traineeIndex 3,4,5: medium progress (40-60%)
    // traineeIndex 6,7: low progress (10-30%)
    // traineeIndex 8+: varied
    const progressLevel = traineeIndex < 3 ? 'high' : traineeIndex < 6 ? 'medium' : traineeIndex < 8 ? 'low' : 'varied';

    for (const subject of subjects) {
        const ts = await prisma.traineeSubject.upsert({
            where: { courseTraineeId_subjectId: { courseTraineeId: ct.id, subjectId: subject.id } },
            update: {},
            create: {
                courseTraineeId: ct.id,
                subjectId: subject.id,
                status: isCompleted ? 'FINISHED' : subject.status,
                grade: subject.status === 'FINISHED' || isCompleted ? 70 + Math.floor(Math.random() * 30) : null,
            },
        });

        // Create trainee tasks with diverse completion status
        const subjectTasks = allTasks.filter((t: any) => t.subjectId === subject.id);
        for (let i = 0; i < subjectTasks.length; i++) {
            const task = subjectTasks[i];
            let status = 'NOT_STARTED';

            if (isCompleted || subject.status === 'FINISHED') {
                status = 'COMPLETED';
            } else if (subject.status === 'IN_PROGRESS') {
                // Diverse completion based on progress level
                switch (progressLevel) {
                    case 'high':
                        // 80% chance completed
                        status = Math.random() < 0.8 ? 'COMPLETED' : (Math.random() < 0.5 ? 'IN_PROGRESS' : 'NOT_STARTED');
                        break;
                    case 'medium':
                        // 50% chance completed
                        status = Math.random() < 0.5 ? 'COMPLETED' : (Math.random() < 0.5 ? 'IN_PROGRESS' : 'NOT_STARTED');
                        break;
                    case 'low':
                        // 20% chance completed
                        status = Math.random() < 0.2 ? 'COMPLETED' : (Math.random() < 0.3 ? 'IN_PROGRESS' : 'NOT_STARTED');
                        break;
                    default: // varied
                        // Alternating pattern
                        status = i % 3 === 0 ? 'COMPLETED' : (i % 3 === 1 ? 'IN_PROGRESS' : 'NOT_STARTED');
                }
            }

            await prisma.traineeTask.upsert({
                where: { traineeId_taskId: { traineeId: trainee.id, taskId: task.id } },
                update: {},
                create: {
                    traineeId: trainee.id,
                    taskId: task.id,
                    status: status as any,
                    completedAt: status === 'COMPLETED' ? new Date() : null,
                },
            });
        }
    }
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
