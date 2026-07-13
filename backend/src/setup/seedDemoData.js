/**
 * Seeds demo clients + invoices spread across the last 12 months so the
 * FluxCRM Analytics page has realistic data to chart.
 *
 * Usage:  cd backend && node src/setup/seedDemoData.js
 * Safe to re-run: it removes previously seeded demo invoices/clients first
 * (identified by the [DEMO] marker) before inserting a fresh set.
 */
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

mongoose.connect(process.env.DATABASE);

// register all models
for (const filePath of globSync('./src/models/**/*.js')) {
  require(path.resolve(filePath));
}

const Admin = mongoose.model('Admin');
const Client = mongoose.model('Client');
const Invoice = mongoose.model('Invoice');

const CLIENTS = [
  'Aurora Studios',
  'BlueWave Consulting',
  'Cedar & Co Law',
  'Delta Fitness',
  'Evergreen Clinic',
  'Falcon Logistics',
];

const STATUSES = ['draft', 'pending', 'sent', 'refunded', 'cancelled', 'on hold'];
const PAY_STATUSES = ['unpaid', 'paid', 'partially'];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

async function seed() {
  try {
    const admin = await Admin.findOne({ email: 'admin@admin.com' });
    if (!admin) {
      console.log('🚫 No admin found. Run `npm run setup` first.');
      return process.exit(1);
    }

    // clean previous demo data
    await Invoice.deleteMany({ notes: '[DEMO]' });
    await Client.deleteMany({ name: { $in: CLIENTS } });

    const clientDocs = await Client.insertMany(
      CLIENTS.map((name) => ({
        name,
        email: name.toLowerCase().replace(/[^a-z]/g, '') + '@example.com',
        country: 'IL',
        createdBy: admin._id,
      }))
    );
    console.log(`👍 ${clientDocs.length} demo clients created`);

    const invoices = [];
    let number = 1000;

    // 3–5 invoices per month for the last 12 months
    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      const perMonth = rand(3, 5);
      for (let j = 0; j < perMonth; j++) {
        const date = new Date();
        date.setMonth(date.getMonth() - monthsAgo);
        date.setDate(rand(1, 28));

        const expiredDate = new Date(date);
        expiredDate.setDate(expiredDate.getDate() + 30);

        const client = pick(clientDocs);
        const quantity = rand(1, 6);
        const price = rand(80, 900);
        const lineTotal = quantity * price;

        const status = pick(STATUSES);
        const paymentStatus = pick(PAY_STATUSES);
        const credit =
          paymentStatus === 'paid'
            ? lineTotal
            : paymentStatus === 'partially'
            ? Math.round(lineTotal / 2)
            : 0;

        invoices.push({
          createdBy: admin._id,
          number: number++,
          year: date.getFullYear(),
          date,
          expiredDate,
          client: client._id,
          items: [
            {
              itemName: pick(['Consulting', 'Design', 'Development', 'Support', 'Training']),
              description: 'Professional service',
              quantity,
              price,
              total: lineTotal,
            },
          ],
          subTotal: lineTotal,
          taxRate: 0,
          taxTotal: 0,
          total: lineTotal,
          credit,
          currency: 'USD',
          status,
          paymentStatus,
          notes: '[DEMO]',
        });
      }
    }

    await Invoice.insertMany(invoices);
    console.log(`👍 ${invoices.length} demo invoices created across 12 months`);
    console.log('🥳 Demo data seeded : Success!');
    process.exit();
  } catch (e) {
    console.log('🚫 Error seeding demo data:');
    console.log(e);
    process.exit(1);
  }
}

seed();
