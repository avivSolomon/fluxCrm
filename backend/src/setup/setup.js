require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { globSync } = require('glob');
const fs = require('fs');
const { generate: uniqueId } = require('shortid');

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);

async function setupApp() {
  try {
    const Admin = require('../models/coreModels/Admin');
    const AdminPassword = require('../models/coreModels/AdminPassword');
    const newAdminPassword = new AdminPassword();

    const salt = uniqueId();

    const passwordHash = newAdminPassword.generateHash(salt, 'admin123');

    const demoAdmin = {
      email: 'admin@admin.com',
      name: 'FluxCRM',
      surname: 'Admin',
      enabled: true,
      role: 'owner',
    };
    const result = await new Admin(demoAdmin).save();

    const AdminPasswordData = {
      password: passwordHash,
      emailVerified: true,
      salt: salt,
      user: result._id,
    };
    await new AdminPassword(AdminPasswordData).save();

    console.log('👍 Admin created : Done!');

    const Setting = require('../models/coreModels/Setting');

    const settingFiles = [];

    const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');

    for (const filePath of settingsFiles) {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      settingFiles.push(...file);
    }

    await Setting.insertMany(settingFiles);

    console.log('👍 Settings created : Done!');

    // These optional models were removed from this (slimmed-down) fork.
    // Seed their defaults only when the model files are actually present,
    // so `npm run setup` no longer crashes with MODULE_NOT_FOUND.
    const path = require('path');
    const modelsDir = path.join(__dirname, '..', 'models', 'appModels');

    if (fs.existsSync(path.join(modelsDir, 'Taxes.js'))) {
      const Taxes = require('../models/appModels/Taxes');
      await Taxes.insertMany([{ taxName: 'Tax 0%', taxValue: '0', isDefault: true }]);
      console.log('👍 Taxes created : Done!');
    }

    if (fs.existsSync(path.join(modelsDir, 'PaymentMode.js'))) {
      const PaymentMode = require('../models/appModels/PaymentMode');
      await PaymentMode.insertMany([
        {
          name: 'Default Payment',
          description: 'Default Payment Mode (Cash , Wire Transfer)',
          isDefault: true,
        },
      ]);
      console.log('👍 PaymentMode created : Done!');
    }

    console.log('🥳 Setup completed :Success!');
    process.exit();
  } catch (e) {
    console.log('\n🚫 Error! The Error info is below');
    console.log(e);
    process.exit();
  }
}

setupApp();
