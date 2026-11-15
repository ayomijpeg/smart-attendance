const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial classes for Software Engineering...');

  await prisma.class.create({
    data: {
      courseCode: 'SWE 301',
      courseTitle: 'Software Architecture & Design',
      lecturer: 'Dr. Adebayo',
    },
  });

  await prisma.class.create({
    data: {
      courseCode: 'SWE 305',
      courseTitle: 'Software Testing & Quality Assurance',
      lecturer: 'Prof. Okafor',
    },
  });

  await prisma.class.create({
    data: {
      courseCode: 'SWE 201',
      courseTitle: 'Introduction to Software Engineering',
      lecturer: 'Engr. Ibrahim',
    },
  });

  console.log('Sample Software Engineering classes created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
