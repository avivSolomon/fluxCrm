const express = require('express');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');

const fileUpload = require('express-fileupload');
// create our Express app
const app = express();

app.use(
  cors({
    // Only the FluxCRM frontend may call the API from a browser.
    // Override with CORS_ORIGINS="https://a.example,https://b.example" when deploying.
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// // default options
// app.use(fileUpload());

// General rate limit for every API request (per client IP, per minute).
// The stricter login limit lives in coreAuth.js. Override with API_RATE_LIMIT.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, result: null, message: 'Too many requests, try again in a minute.' },
});
app.use('/api', apiLimiter);

// Here our API Routes

app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
