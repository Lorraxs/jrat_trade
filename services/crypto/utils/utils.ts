export function crossover(series1: number[], series2: number[]): boolean {
  if (series1.length < 2 || series2.length < 2) {
    throw new Error("Series must have at least two elements");
  }

  const prev1 = series1[series1.length - 2];
  const curr1 = series1[series1.length - 1];
  const prev2 = series2[series2.length - 2];
  const curr2 = series2[series2.length - 1];

  return prev1 <= prev2 && curr1 > curr2;
}

export function crossunder(close: number[], currentLevels: number[]) {
  if (close.length < 2 || currentLevels.length < 2) return false;
  const prevClose = close[close.length - 2];
  const currClose = close[close.length - 1];
  const prevLevel = currentLevels[currentLevels.length - 2];
  const currLevel = currentLevels[currentLevels.length - 1];
  return prevClose > prevLevel && currClose < currLevel;
}

/**
 * Get the highest value over a specified number of bars.
 * @param values - Array of values (e.g., high prices).
 * @param length - Number of bars to look back.
 * @returns The highest value over the specified number of bars.
 */
export function highest(values: number[], length: number): number {
  if (values.length < length) {
    throw new Error("Not enough data points to calculate the highest value");
  }

  let highestValue = -Infinity;
  for (let i = values.length - length; i < values.length; i++) {
    if (values[i] > highestValue) {
      highestValue = values[i];
    }
  }
  return highestValue;
}

/**
 * Get the lowest value over a specified number of bars.
 * @param values - Array of values (e.g., low prices).
 * @param length - Number of bars to look back.
 * @returns The lowest value over the specified number of bars.
 */
export function lowest(values: number[], length: number): number {
  if (values.length < length) {
    throw new Error("Not enough data points to calculate the lowest value");
  }

  let lowestValue = Infinity;
  for (let i = values.length - length; i < values.length; i++) {
    if (values[i] < lowestValue) {
      lowestValue = values[i];
    }
  }
  return lowestValue;
}

/**
 * Calculate the difference between the current value and the previous value of a series.
 * @param values - Array of values (e.g., prices).
 * @returns The difference between the current value and the previous value.
 */
export function change(values: number[]): number {
  if (values.length < 2) {
    throw new Error("Not enough data points to calculate the change");
  }

  const currentValue = values[values.length - 1];
  const previousValue = values[values.length - 2];

  return currentValue - previousValue;
}

export function calculateCurrentRSI(
  prices: number[],
  period: number
): number | null {
  if (prices.length < period + 1) {
    // Không đủ dữ liệu để tính RSI
    return null;
  }

  let gainSum = 0;
  let lossSum = 0;

  // Tính tổng lợi nhuận và tổn thất trong chu kỳ
  for (let i = prices.length - period; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference > 0) {
      gainSum += difference;
    } else {
      lossSum += -difference;
    }
  }

  // Tính mức tăng và giảm trung bình
  const averageGain = gainSum / period;
  const averageLoss = lossSum / period;

  if (averageLoss === 0) {
    return 100; // RSI sẽ là 100 nếu không có tổn thất trong chu kỳ
  }

  // Tính RS và RSI
  const rs = averageGain / averageLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}
