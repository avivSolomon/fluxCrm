const request = require('supertest');
const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');

// Create the demo owner admin (email admin@admin.com / password admin123).
async function seedAdmin() {
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const admin = await new Admin({
    email: 'admin@admin.com',
    name: 'Test',
    surname: 'Admin',
    enabled: true,
    role: 'owner',
  }).save();

  const newPassword = new AdminPassword();
  const salt = uniqueId();
  const passwordHash = newPassword.generateHash(salt, 'admin123');

  await new AdminPassword({
    password: passwordHash,
    emailVerified: true,
    salt,
    user: admin._id,
  }).save();

  return admin;
}

// Seed the admin, log in through the real endpoint and return a valid token.
async function loginAsAdmin(app) {
  await seedAdmin();
  const res = await request(app)
    .post('/api/login')
    .send({ email: 'admin@admin.com', password: 'admin123' });
  return res.body.result.token;
}

module.exports = { seedAdmin, loginAsAdmin };
