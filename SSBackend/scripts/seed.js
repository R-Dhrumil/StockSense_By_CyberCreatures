import { initDB, pool } from '../src/config/db.js';
import { User } from '../src/models/user.model.js';
import { ROLES, ALL_ROLES } from '../src/config/roles.js';
import { logger } from '../src/utils/logger.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    // Ensure tables exist
    await initDB();

    logger.info('Clearing existing users and records...');
    await User.deleteMany();

    logger.info('Seeding core predictable StockSense accounts...');

    const adminPassword = await bcrypt.hash('Admin@1234', 10);
    const managerPassword = await bcrypt.hash('Manager@1234', 10);
    const staffPassword = await bcrypt.hash('Staff@1234', 10);

    // 1. Primary Admin Account
    await User.create({
      name: 'Alexandria Vance',
      email: 'admin@stocksense.io',
      password: adminPassword,
      role: 'ADMIN',
      department: 'Executive Operations',
    });

    // 2. Inventory Manager Account
    await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@stocksense.io',
      password: managerPassword,
      role: 'INVENTORY_MANAGER',
      department: 'Inventory Control',
    });

    // 3. Warehouse Staff Account
    await User.create({
      name: 'Marcus Vance',
      email: 'marcus.vance@stocksense.io',
      password: staffPassword,
      role: 'STAFF',
      department: 'Warehouse Floor',
    });

    // 3. Generate 12 Realistic Mock Users for Live Demos & Dashboards
    logger.info('Generating 12 realistic mock user records with @faker-js/faker...');
    const departments = ['Warehouse', 'Logistics', 'Operations', 'Procurement', 'SupplyChain'];
    const fakeUserData = [];

    for (let i = 0; i < 12; i++) {
      const randomRole = ALL_ROLES[Math.floor(Math.random() * ALL_ROLES.length)];
      fakeUserData.push({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: defaultUserPassword,
        role: randomRole,
        department: departments[Math.floor(Math.random() * departments.length)],
        isActive: faker.datatype.boolean({ probability: 0.9 }),
      });
    }

    await User.createMany(fakeUserData);

    logger.success('✅ PostgreSQL (Direct SQL) seeded with rich pitch-ready mock data!\n');

    console.log('╔═════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                   🚀 STOCKSENSE HACKATHON ACCOUNTS                                  ║');
    console.log('╠═════════════════════════════════════════════════════════════════════════════════════╣');
    console.log('║ Role              │ Email                                │ Password                 ║');
    console.log('╠═══════════════════╪══════════════════════════════════════╪══════════════════════════╣');
    console.log('║ ADMIN             │ admin@hackathon.com                  │ adminpassword123         ║');
    console.log('║ INVENTORY_MANAGER │ inventorymanager@hackathon.com       │ userpassword123          ║');
    console.log('║ STAFF             │ staff@hackathon.com                  │ userpassword123          ║');
    console.log('╚═════════════════════════════════════════════════════════════════════════════════════╝');
    console.log(`\n📊 Total Users Seeded: ${seededRoles.length + fakeUserData.length}`);
    console.log('📌 Swagger Interactive Docs: http://localhost:5000/docs\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    await pool.end();
    process.exit(1);
  }
};

seedDatabase();
