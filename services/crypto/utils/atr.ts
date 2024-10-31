/**
 * Calculate the True Range (TR) for a given period.
 * @param currentHigh - Current high price.
 * @param currentLow - Current low price.
 * @param previousClose - Previous close price.
 * @returns The True Range value.
 */
function calculateTrueRange(
  currentHigh: number,
  currentLow: number,
  previousClose: number
): number {
  return Math.max(
    currentHigh - currentLow,
    Math.abs(currentHigh - previousClose),
    Math.abs(currentLow - previousClose)
  );
}

/**
 * Calculate the Average True Range (ATR) for a single point.
 * @param high - Array of high prices.
 * @param low - Array of low prices.
 * @param close - Array of close prices.
 * @param period - Number of periods to calculate the ATR.
 * @returns The ATR value for the most recent period.
 */
export function calculateATR(
  high: number[],
  low: number[],
  close: number[],
  period: number
): number {
  if (high.length < period || low.length < period || close.length < period) {
    throw new Error("Not enough data points to calculate the ATR");
  }

  const trueRange = calculateTrueRange(
    high[high.length - 1],
    low[low.length - 1],
    close[close.length - 2]
  );
  let atr = 0;

  if (high.length === period) {
    // Calculate the initial ATR as the average of the first 'period' True Range values
    let sumTR = 0;
    for (let i = 1; i < period; i++) {
      sumTR += calculateTrueRange(high[i], low[i], close[i - 1]);
    }
    atr = sumTR / period;
  } else {
    // Calculate the ATR using the previous ATR value
    const previousATR = calculateATR(
      high.slice(0, -1),
      low.slice(0, -1),
      close.slice(0, -1),
      period
    );
    atr = (previousATR * (period - 1) + trueRange) / period;
  }

  return atr;
}

/* // Example usage:
const highPrices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const lowPrices = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const closePrices = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const period = 5;
const atrValue = calculateATR(highPrices, lowPrices, closePrices, period);
console.log(atrValue); // Output: ATR value for the most recent period */
