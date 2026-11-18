const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const updateLanguage = require('./updateLanguage');

const adminController = createUserController('Admin');

// Ram's end-to-end flow: save the signed-in admin's preferred UI language.
adminController.updateLanguage = updateLanguage;

module.exports = adminController;
