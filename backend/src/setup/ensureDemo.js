/**
 * Idempotent demo preparation: safe to run on every start.
 *  - empty database      -> run setup (admin + default settings)
 *  - no invoices yet     -> run seed (demo clients + invoices)
 * Usage: cd backend && node src/setup/ensureDemo.js
 */
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const { spawnSync } = require('child_process');

const run = (script) => {
  const r = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${script} failed`);
};

(async () => {
  await mongoose.connect(process.env.DATABASE, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const admins = await db.collection('admins').countDocuments({ removed: false });
  const invoices = await db.collection('invoices').countDocuments({ removed: false });
  await mongoose.disconnect();

  if (admins === 0) run('src/setup/setup.js');
  else console.log('Admin exists - setup skipped');

  if (invoices === 0) run('src/setup/seedDemoData.js');
  else console.log(`${invoices} invoices exist - seed skipped`);
})().catch((e) => {
  console.error('ensureDemo failed:', e.message);
  process.exit(1);
});
