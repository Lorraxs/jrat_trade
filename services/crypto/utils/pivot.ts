export class Pivot {
  currentLevel: number;
  lastLevel: number;
  crossed: boolean;
  barTime: number;
  barIndex: number;

  constructor(
    currentLevel: number,
    lastLevel: number,
    crossed: boolean,
    barTime: number,
    barIndex: number
  ) {
    this.currentLevel = currentLevel;
    this.lastLevel = lastLevel;
    this.crossed = crossed;
    this.barTime = barTime;
    this.barIndex = barIndex;
  }
}
