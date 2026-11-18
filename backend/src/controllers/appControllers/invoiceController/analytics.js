const mongoose = require('mongoose');
const moment = require('moment');
const Joi = require('joi');

const Model = mongoose.model('Invoice');

const MAX_MONTHS = 36;

const querySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
}).unknown(false);

/**
 * Validate ?from=&to= and turn them into a month-aligned window.
 * Default window = last 12 months (incl. current). Max span = 36 months.
 * Returns { error } or { start, end, months }.
 */
const resolveRange = (query) => {
  const { error, value } = querySchema.validate(query);
  if (error) return { error: 'Invalid date parameters (use ISO dates: from, to).' };

  const end = value.to ? moment(value.to).endOf('month') : moment().endOf('month');
  const start = value.from
    ? moment(value.from).startOf('month')
    : moment(end).subtract(11, 'months').startOf('month');

  if (end.isBefore(start)) return { error: '"to" must not be before "from".' };

  const months = end.diff(start, 'months') + 1;
  if (months > MAX_MONTHS) return { error: `Range too long (max ${MAX_MONTHS} months).` };

  return { start, end, months };
};

/**
 * Shared by the JSON endpoint and the CSV export.
 * Three MongoDB aggregations over the selected window:
 *   1. monthlyRevenue  – total invoiced amount per month (continuous series, empty months = 0)
 *   2. statusBreakdown – invoice count grouped by status
 *   3. topClients      – the 5 clients with the highest invoiced revenue
 */
const buildAnalytics = async ({ start, end, months }) => {
  const startDate = start.toDate();
  const endDate = end.toDate();
  const inRange = { removed: false, date: { $gte: startDate, $lte: endDate } };

  const monthlyRaw = await Model.aggregate([
    { $match: inRange },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthlyRevenue = [];
  for (let i = 0; i < months; i++) {
    const m = moment(start).add(i, 'months');
    const found = monthlyRaw.find((r) => r._id.year === m.year() && r._id.month === m.month() + 1);
    monthlyRevenue.push({
      label: m.format('MMM YYYY'),
      total: found ? found.total : 0,
      count: found ? found.count : 0,
    });
  }

  const statusRaw = await Model.aggregate([
    { $match: inRange },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const statusBreakdown = statusRaw.map((s) => ({ status: s._id || 'unknown', count: s.count }));

  const topClients = await Model.aggregate([
    { $match: inRange },
    { $group: { _id: '$client', total: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
    { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        name: { $ifNull: ['$client.name', 'Unknown'] },
        total: 1,
        count: 1,
      },
    },
  ]);

  return { monthlyRevenue, statusBreakdown, topClients };
};

const badRequest = (res, message) =>
  res.status(400).json({ success: false, result: null, message });

// GET /api/invoice/analytics?from=2026-01-01&to=2026-06-30
const analytics = async (req, res) => {
  const range = resolveRange(req.query);
  if (range.error) return badRequest(res, range.error);

  const result = await buildAnalytics(range);
  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully retrieved invoice analytics',
  });
};

// GET /api/invoice/analytics/export?from=&to=  -> CSV download (UTF-8 with BOM for Excel)
const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;

const exportCsv = async (req, res) => {
  const range = resolveRange(req.query);
  if (range.error) return badRequest(res, range.error);

  const { monthlyRevenue, statusBreakdown, topClients } = await buildAnalytics(range);
  const lines = [
    ['section', 'name', 'total', 'count'],
    ...monthlyRevenue.map((m) => ['monthly_revenue', m.label, m.total, m.count]),
    ...statusBreakdown.map((s) => ['status', s.status, '', s.count]),
    ...topClients.map((c) => ['top_client', c.name, c.total, c.count]),
  ].map((row) => row.map(csvCell).join(','));

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="fluxcrm-analytics.csv"');
  return res.status(200).send('﻿' + lines.join('\r\n'));
};

module.exports = analytics;
module.exports.exportCsv = exportCsv;
