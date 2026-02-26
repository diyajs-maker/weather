const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.POSTGRES_URL);

async function seedAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const role = 'ADMIN';

  try {
    const result = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email}, ${password_hash}, ${role})
      ON CONFLICT (email) DO NOTHING
      RETURNING *
    `;
    console.log('Admin user seeded:', result[0]);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

seedAdmin();
