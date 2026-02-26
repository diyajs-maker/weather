import { db } from './client';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // 1. Create NYC City
    const cities = await db.getCities();
    let nycCity = cities.find(c => c.name === 'New York');
    
    if (!nycCity) {
      nycCity = await db.createCity({
        name: 'New York',
        state: 'NY',
        nws_office: 'OKX',
        nws_grid_x: 33,
        nws_grid_y: 35,
        alert_temp_delta: 5.0,
        alert_window_hours: 6,
        is_active: true,
      });
      console.log('NYC city created:', nycCity.id);
    } else {
      console.log('NYC city already exists');
    }

    // 2. Create Admin User
    const adminEmail = 'admin@example.com';
    const existingAdmin = await db.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const adminUser = await db.createUser({
        email: adminEmail,
        password_hash: passwordHash,
        role: 'ADMIN'
      });
      console.log('Admin user created:', adminUser.email);
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database seeding complete');
    return { cityId: nycCity.id };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
