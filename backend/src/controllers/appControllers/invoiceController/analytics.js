const mongoose = require('mongoose');
const moment = require('moment');

const Model = mongoose.model('Invoice');

/**
 * FluxCRM analytics endpoint (original addition).
 * Returns three datasets in a single call so the Analytics page can render:
 *   1. monthlyRevenue  – total invoiced amount per month for the last 12 months
 *   2. statusBreakdown – invoice count grouped by status (for the pie chart)
 *   3. topClients      – the 5 clients with the highest invoiced revenue
 */
const analytics = async (req, res) => {
  // --- date window: first day of the month, 11 months back (=> 12 months incl. current) ---
  const startDate = moment().subtract(11, 'months').startOf('month').toDate();

  // 1) Revenue per month (last 12 months) --------------------------------------
  const monthlyRaw = await Model.aggregate([
    { $match: { removed: false, date: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Build a continuous 12-month series so months with no invoices show as 0.
  const monthlyRevenue = [];
  for (let i = 0; i < 12; i++) {
    const m = moment().subtract(11 - i, 'months');
    const found = monthlyRaw.find(
      (r) => r._id.year === m.year() && r._id.month === m.month() + 1
    );
    monthlyRevenue.push({
      label: m.format('MMM YYYY'),
      total: found ? found.total : 0,
      count: found ? found.count : 0,
    });
  }

  // 2) Invoice count by status -------------------------------------------------
  const statusRaw = await Model.aggregate([
    { $match: { removed: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const statusBreakdown = statusRaw.map((s) => ({
    status: s._id || 'unknown',
    count: s.count,
  }));

  // 3) Top 5 clients by total invoiced revenue ---------------------------------
  const topClients = await Model.aggregate([
    { $match: { removed: false } },
    { $group: { _id: '$client', total: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client',
      },
    },
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

  return res.status(200).json({
    success: true,
    result: { monthlyRevenue, statusBreakdown, topClients },
    message: 'Successfully retrieved invoice analytics',
  });
};

module.exports = analytics;
