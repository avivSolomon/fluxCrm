const filter = async (Model, req, res) => {
  if (req.query.filter === undefined || req.query.equal === undefined) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'filter not provided correctly',
    });
  }
  // Reject MongoDB operator injection: Express parses ?equal[$ne]=x into an object.
  // Only plain values are allowed (same rule as paginatedList).
  if (typeof req.query.equal === 'object' || typeof req.query.filter !== 'string') {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Invalid filter value',
    });
  }
  const result = await Model.find({
    removed: false,
  })
    .where(req.query.filter)
    .equals(req.query.equal)
    .exec();
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    // Return success resposne
    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found all documents  ',
    });
  }
};

module.exports = filter;
