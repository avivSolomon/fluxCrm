const express = require('express');
const rateLimit = require('express-rate-limit');

// Brute-force protection on login (skipped under test to keep suites deterministic)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, result: null, message: 'Too many login attempts, try again later.' },
});

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const adminAuth = require('@/controllers/coreControllers/adminAuth');

router.route('/login').post(loginLimiter, catchErrors(adminAuth.login));

router.route('/forgetpassword').post(catchErrors(adminAuth.forgetPassword));
router.route('/resetpassword').post(catchErrors(adminAuth.resetPassword));

router.route('/logout').post(adminAuth.isValidAuthToken, catchErrors(adminAuth.logout));

module.exports = router;
