export type ITrailingExtremes = {
  top: number;
  bottom: number;
  barTime: number;
  barIndex: number;
  lastTopTime: number;
  lastBottomTime: number;
};

export type IOrderBlock = {
  barHigh: number;
  barLow: number;
  barTime: number;
  bias: number;
};
