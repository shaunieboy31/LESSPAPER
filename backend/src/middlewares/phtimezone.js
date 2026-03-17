const { formatInTimeZone } = require("date-fns-tz");

const formatToPHTime = (date) => {
  return formatInTimeZone(date, "Asia/Manila", "yyyy-MM-dd'T'HH:mm:ssXXX");
};

module.exports = {
  formatToPHTime,
};
