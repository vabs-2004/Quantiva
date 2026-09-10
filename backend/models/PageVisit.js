const mongoose = require("mongoose");

/**
 * Tracks the number of visits to a specific page on a specific date.
 * Used for aggregating page popularity over time.
 */
const pageVisitSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  count: {
    type: Number,
    default: 1
  }
});

// Compound index to ensure uniqueness per page per day
pageVisitSchema.index({ path: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("PageVisit", pageVisitSchema);
