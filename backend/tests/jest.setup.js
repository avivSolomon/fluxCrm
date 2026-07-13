// Jest global setup for FluxCRM backend tests.
// Runs before every test file: registers models, connects to an
// ISOLATED test database, and cleans data between tests.
require('module-alias/register');
require('dotenv').config({ path: '.env' });

// Never touch the real dev database — use a dedicated test DB.
process.env.DATABASE = 'mongodb://127.0.0.1:27017/fluxcrm_test';
// Guarantee a JWT secret even if .env is missing one in CI.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

// Register every model up-front so requiring the app (which builds
// CRUD controllers via mongoose.model(name)) never fails.
for (const file of globSync('./src/models/**/*.js')) {
  require(path.resolve(file));
}

beforeAll(async () => {
  await mongoose.connect(process.env.DATABASE);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
