const Joi = require('joi');
const mongoose = require('mongoose');

const SUPPORTED_LANGUAGES = ['en_us', 'he_il'];

const schema = Joi.object({
  language: Joi.string()
    .valid(...SUPPORTED_LANGUAGES)
    .required(),
});

/**
 * PATCH /api/admin/profile/language   body: { language: 'en_us' | 'he_il' }
 * Validates the code, stores it on the signed-in Admin (req.admin is set by the
 * auth middleware) and returns the saved value.
 */
const updateLanguage = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Unsupported language. Allowed: ' + SUPPORTED_LANGUAGES.join(', '),
    });
  }

  const Admin = mongoose.model('Admin');
  const updated = await Admin.findOneAndUpdate(
    { _id: req.admin._id, removed: false },
    { language: value.language },
    { new: true }
  ).exec();

  if (!updated) {
    return res.status(404).json({ success: false, result: null, message: 'Admin not found.' });
  }

  return res.status(200).json({
    success: true,
    result: { language: updated.language },
    message: 'Language preference saved',
  });
};

module.exports = updateLanguage;
