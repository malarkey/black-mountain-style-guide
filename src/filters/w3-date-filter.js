const { DateTime } = require('luxon');

module.exports = function(date) {
  // Handle string dates like '2021-04-28'
  if (typeof date === 'string') {
    date = new Date(date);
  }

  // Handle invalid dates
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }

  return date.toISOString();
};