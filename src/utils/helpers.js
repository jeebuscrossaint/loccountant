/**
 * Helper utility functions
 */

/**
 * Format a number with commas for thousands
 */
exports.formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Sleep for a specified amount of time
 */
exports.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
