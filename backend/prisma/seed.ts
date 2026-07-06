import { PrismaClient, EmployeeType, ContractType, ShiftStatus, PlanStatus, NotificationType, NotificationChannel } from '../src/generated/prisma/client.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Categories (Roles/Departments)
  const categoryNames = ['Chef', 'Waiter', 'Bartender', 'Manager', 'Dishwasher'];
  const categories = [];
  for (const name of categoryNames) {
    let category = await prisma.category.findFirst({ where: { name } });
    if (!category) {
      category = await prisma.category.create({
        data: { name },
      });
    }
    categories.push(category);
  }
  console.log(`Ensured ${categories.length} categories.`);

  // 2. Create Admins
  const adminEmails = ['admin1@test.com', 'admin2@test.com'];
  const admins = [];
  for (const email of adminEmails) {
    const admin = await prisma.admin.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        name: faker.person.fullName(),
        isActive: true,
      },
    });
    admins.push(admin);
  }
  console.log(`Ensured ${admins.length} mock admins.`);

  // 3. Create Users
  const users = [];
  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName, provider: 'test.com' });
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const contractType = faker.helpers.arrayElement([ContractType.HOURLY, ContractType.MONTHLY_SALARY, ContractType.WORKLOAD_PERCENT]);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          department: faker.helpers.arrayElement(['Kitchen', 'Front of House', 'Bar', 'Management']),
          designation: faker.person.jobTitle(),
          employeeType: faker.helpers.arrayElement([EmployeeType.FULL_TIME, EmployeeType.PART_TIME]),
          contractType,
          hourlyRate: faker.number.int({ min: 15, max: 35 }),
          monthlySalary: contractType === ContractType.MONTHLY_SALARY ? faker.number.int({ min: 3000, max: 6000 }) : null,
          contractedHoursMonthly: contractType !== ContractType.HOURLY ? faker.number.int({ min: 80, max: 160 }) : null,
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    users.push(user);
    
    // Link to categories
    const userCategoriesCount = faker.number.int({ min: 1, max: 2 });
    const assignedCategories = faker.helpers.arrayElements(categories, userCategoriesCount);
    for (const cat of assignedCategories) {
      await prisma.userCategory.upsert({
        where: {
          userId_categoryId: {
            userId: user.id,
            categoryId: cat.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          categoryId: cat.id,
        },
      });
    }
  }
  console.log(`Ensured ${users.length} mock users.`);

  // 4. Create Weekly Plans & Shifts
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  const plansToCreate = [
    { year: currentYear, month: currentMonth, weekNumber: 1, status: PlanStatus.PUBLISHED },
    { year: currentYear, month: currentMonth, weekNumber: 2, status: PlanStatus.DRAFT }
  ];

  for (const planData of plansToCreate) {
    const weekStartDate = new Date(planData.year, planData.month - 1, 1 + (planData.weekNumber - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const plan = await prisma.weeklyPlan.upsert({
      where: {
        year_month_weekNumber: {
          year: planData.year,
          month: planData.month,
          weekNumber: planData.weekNumber,
        }
      },
      update: {},
      create: {
        year: planData.year,
        month: planData.month,
        weekNumber: planData.weekNumber,
        weekStartDate,
        weekEndDate,
        status: planData.status,
        submittedById: admins[0].id,
      },
    });

    // 5. Create Shifts for this plan
    for (let i = 0; i < 20; i++) {
      const shiftDate = new Date(weekStartDate);
      shiftDate.setDate(shiftDate.getDate() + faker.number.int({ min: 0, max: 6 }));
      
      const startHour = faker.number.int({ min: 8, max: 16 });
      const startTime = new Date(shiftDate);
      startTime.setHours(startHour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startHour + 8, 0, 0, 0); // 8 hour shift

      const randomUser = faker.helpers.arrayElement(users);
      const randomCategory = faker.helpers.arrayElement(categories);

      const isPublished = planData.status === PlanStatus.PUBLISHED;
      const actualStart = isPublished ? new Date(startTime.getTime()) : null;
      const actualEnd = isPublished ? new Date(endTime.getTime()) : null;
      if (isPublished) {
        // randomly add some overtime (0 to 2 hours)
        actualEnd!.setHours(actualEnd!.getHours() + faker.number.int({ min: 0, max: 2 }));
      }

      await prisma.shift.create({
        data: {
          weeklyPlanId: plan.id,
          userId: randomUser.id,
          categoryId: randomCategory.id,
          date: shiftDate,
          startTime,
          endTime,
          actualStartTime: actualStart,
          actualEndTime: actualEnd,
          actualBreakMinutes: isPublished ? 30 : null,
          status: isPublished ? ShiftStatus.ACCEPTED : ShiftStatus.PENDING,
        },
      });
    }
    console.log(`Generated Weekly Plan (Week ${planData.weekNumber}) with mock shifts.`);
  }

  // 6. Notifications (just adding a few for random users)
  for (let i = 0; i < 10; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    await prisma.notification.create({
      data: {
        userId: randomUser.id,
        type: NotificationType.GENERAL,
        channel: NotificationChannel.IN_APP,
        title: faker.lorem.sentence({ min: 3, max: 6 }),
        body: faker.lorem.paragraph(),
        payload: { info: "mock_data" },
      },
    });
  }
  console.log(`Generated 10 mock notifications.`);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
