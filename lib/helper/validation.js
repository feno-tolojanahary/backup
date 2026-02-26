const { default: CronExpressionParser } = require("cron-parser");

exports.validCronExpression = (cronStr) => {
    try {  
        CronExpressionParser.parse(cronStr);        
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Validate and normalize an interval value to seconds.
 *
 * @param {string|number} input - user input (CLI)
 * @param {object} options
 * @param {number} options.minSeconds - minimum allowed interval
 * @param {number} options.maxSeconds - maximum allowed interval
 * @returns {number} interval in seconds
 * @throws Error if invalid
 */
exports.parseIntervalToSeconds = (
  input,
  { minSeconds = 60, maxSeconds = 365 * 24 * 3600 } = {}
) => {
  if (typeof input === "number") {
    if (!Number.isInteger(input) || input <= 0) {
      throw new Error("Interval must be a positive integer");
    }
    if (input < minSeconds) {
      throw new Error(`Interval must be >= ${minSeconds} seconds`);
    }
    if (input > maxSeconds) {
      throw new Error(`Interval must be <= ${maxSeconds} seconds`);
    }
    return input;
  }

  if (typeof input !== "string") {
    throw new Error("Interval must be a string or number");
  }

  const value = input.trim();

  const match = /^([1-9]\d*)([smhd])?$/.exec(value);
  if (!match) {
    throw new Error(
      "Invalid interval format. Use: <number>[s|m|h|d]"
    );
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? "s";

  const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };

  const seconds = amount * multipliers[unit];

  if (seconds < minSeconds) {
    throw new Error(`Interval must be >= ${minSeconds} seconds`);
  }

  if (seconds > maxSeconds) {
    throw new Error(`Interval must be <= ${maxSeconds} seconds`);
  }

  return seconds;
}