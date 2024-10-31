export class Series<T = any> {
  data: T[];

  constructor(data: T[] = []) {
    this.data = data;
  }

  length(): number {
    return this.data.length;
  }

  // Get the current value (last element in the series)
  current(): T {
    return this.data[this.data.length - 1];
  }

  // Get the previous value (second to last element in the series)
  previous(): T {
    if (this.data.length < 2) {
      throw new Error("Series must have at least two elements");
    }
    return this.data[this.data.length - 2];
  }

  // Add a new value to the series
  add(value: T): void {
    this.data.push(value);
  }

  next(): void {
    this.add(this.current());
  }

  // Get the value at a specific index from the end (0 is the last element)
  at(index: number): T {
    if (index >= this.data.length) {
      throw new Error("Index out of bounds");
    }
    return this.data[this.data.length - 1 - index];
  }
}

/* // Example usage:
const closeSeries = new Series([1, 2, 3, 4, 5]);
console.log(closeSeries.current()); // Output: 5
console.log(closeSeries.previous()); // Output: 4
closeSeries.add(6);
console.log(closeSeries.current()); // Output: 6
console.log(closeSeries.at(2)); // Output: 4 */
