import { describe, it, expect } from "@jest/globals";
import { updateValue } from "../index";

// should work with map, set, date, and objects and arrays.

describe("destructures objects properly", () => {
  it("should rebuild refs for nested objects involved", () => {
    const address = { city: "1" };
    const test = {
      a: {
        b: {
          e: {},
          c: {
            d: 10,
          },
          a: [
            {
              f: {},
              g: 1,
            },
            {
              m: new Map(),
            },
          ],
        },
      },
      b: {},
    };
    const obj = { address, test };
    updateValue(obj, ["test", "a", "b", "c", "d"], 12);

    expect(obj.test === test).toBe(false);
    expect(obj.test.b === test.b).toBe(true);
    expect(obj.address === address).toBe(true);
    expect(obj.test.a !== test.a).toBe(true);
    expect(obj.test.a.b !== test.a.b).toBe(true);
    expect(obj.test.a.b.c !== test.a.b.c).toBe(true);
    expect(obj.test.a.b.e === test.a.b.e).toBe(true);

    updateValue(obj, ["test", "a", "b", "a", 0, "g"], 12);
    expect(obj.test.a.b.a[0].g).toBe(12);
    expect(obj.test.a.b.a[0] !== test.a.b.a[0]).toBe(true);
    expect(obj.test.a.b.a[0].f === test.a.b.a[0].f).toBe(true);

    updateValue(obj, ["test", "a", "b", "a", 1, "m", "a"], {
      address: { street: 10 },
      test: {},
    });
    expect(obj.test.a.b.a[1]?.m?.get("a")?.address?.street).toBe(10);
    expect(
      obj.test.a.b.a[1]?.m?.get("a")?.test !== test.a.b.a[1]?.m?.get("a")?.test
    ).toBe(true);
    expect(obj.test.a.b.a[1]?.m !== test.a.b.a[1]?.m).toBe(true);

    updateValue(
      obj,
      ["test", "a", "b", "a", 1, "m", "a", "address", "street"],
      12
    );
    expect(obj.test.a.b.a[1]?.m?.get("a")?.address?.street).toBe(12);
    expect(obj.test.a.b.a[1]?.m !== test.a.b.a[1]?.m).toBe(true);
  });
});

describe("updateValue with map", () => {
  it("should work with map", () => {
    const map = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    updateValue(map, ["a"], 3);
    expect(map.get("a")).toBe(3);
  });
});

describe("updateValue with set", () => {
  it("should work with set", () => {
    const set = new Set([1, 2, 3]);
    updateValue(set, [0], 4);
    expect(set.has(4)).toBe(true);
  });
});

describe("updateValue with object", () => {
  it("should work with object", () => {
    const obj = { a: 1, b: 2 };
    updateValue(obj, ["a"], 3);
    expect(obj.a).toBe(3);
  });
});

describe("updateValue with array", () => {
  it("should work with array", () => {
    const arr = [1, 2, 3];
    updateValue(arr, 0, 4);
    expect(arr[0]).toBe(4);
  });
});

// now lets try these objects in nested
describe("updateValue with nested map", () => {
  it("should work with nested map", () => {
    const map = new Map([["a", new Map([["b", 1]])]]);
    updateValue(map, ["a", "b"], 2);
    expect(map.get("a")?.get("b")).toBe(2);
  });
});

describe("updateValue with nested set", () => {
  it("should work with nested set", () => {
    const set = new Set([new Set([1])]);
    updateValue(set, "0.0", 2);
    expect([...[...set][0]][0]).toBe(2);
  });
});

// now map in side objects nested deep.
describe("updateValue with nested map in object", () => {
  it("should work with nested map in object", () => {
    const m = new Map([["c", 1]]);
    const obj = { a: { b: m } };
    updateValue(obj, "a.b.c", 2);
    expect(obj.a.b.get("c")).toBe(2);
    expect(obj.a.b !== m).toBe(true);
  });
});

describe("updateValue with nested set in object", () => {
  it("should work with nested set in object", () => {
    const s = new Set([1]);
    const obj = { a: { b: s } };
    updateValue(obj, "a.b.0", 2);
    expect([...obj.a.b][0]).toBe(2);
    expect(obj.a.b !== s).toBe(true);
  });
});

describe("updateValue edge cases", () => {
  it("should not modify non-object types", () => {
    const num = 42;
    updateValue(num, "a", 1);
    expect(num).toBe(42);
  });

  it("should handle deeply nested structures", () => {
    const obj = { a: { b: { c: { d: 1 } } } };
    updateValue(obj, "a.b.c.d", 2);
    expect(obj.a.b.c.d).toBe(2);
  });

  it("should handle empty objects, maps, and sets", () => {
    const map = new Map();
    updateValue(map, ["a"], 1);
    expect(map.get("a")).toBe(1);

    const set = new Set();
    updateValue(set, 0, 1);
    expect(set.has(1)).toBe(true);
  });

  it("should handle concurrent modifications", () => {
    const obj = { a: 1 };
    updateValue(obj, ["a"], 2);
    updateValue(obj, ["a"], 3);
    expect(obj.a).toBe(3);
  });

  it("should handle keys with special characters", () => {
    const obj = { "a.b": 1 };
    updateValue(obj, ["a.b"], 2);
    expect(obj["a.b"]).toBe(2);
  });

  it("should handle large data structures", () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => i);
    updateValue(largeArray, 9999, 42);
    expect(largeArray[9999]).toBe(42);

    const largeMap = new Map(Array.from({ length: 10000 }, (_, i) => [i, i]));
    updateValue(largeMap, 9999, 42);
    expect(largeMap.get(9999)).toBe(42);
  });
});
