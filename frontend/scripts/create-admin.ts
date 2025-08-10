import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`Admin user with email ${email} already exists.`);
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('Admin user created successfully:');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Created: ${admin.createdAt}`);
    console.log('\nLogin credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  Make sure to change the admin password after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createAdmin();
}

export default createAdmin;
