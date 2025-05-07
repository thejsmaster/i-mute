import { i, q, updateValue, shallowClone, df } from "../index";
import { describe, it, expect } from "@jest/globals";

describe("Extra stability and edge cases for immer alternative", () => {
  it("should handle empty objects and arrays", () => {
    expect(
      i({} as any, (draft: any) => {
        draft.a = 1;
      })
    ).toEqual({ a: 1 });
    const arrResult = i([] as any, (draft: any) => {
      draft.push(1);
    });
    expect(Array.from(arrResult)).toEqual([1]);
  });

  it("should handle null and undefined as input", () => {
    expect(() => i(null as any, () => {})).toThrow();
    expect(() => i(undefined as any, () => {})).toThrow();
  });

  it("should not mutate the original object", () => {
    const obj = { a: 1, b: { c: 2 } };
    const result = i(obj, (draft) => {
      draft.b.c = 3;
    });
    expect(obj.b.c).toBe(2);
    expect(result.b.c).toBe(3);
  });

  it("should handle deeply nested objects and arrays", () => {
    const obj = { a: [{ b: { c: [1, 2, { d: 3 }] } }] };
    const result = i(obj, (draft) => {
      (draft.a[0].b.c[2] as { d: number }).d = 4;
    });
    expect((result.a[0].b.c[2] as { d: number }).d).toBe(4);
    expect((obj.a[0].b.c[2] as { d: number }).d).toBe(3);
  });

  it("should handle deeply nested Maps and Sets", () => {
    const obj = {
      map: new Map<any, any>([
        ["a", new Set([1, 2, 3])],
        ["b", new Map<any, any>([["c", new Set([4, 5])]])],
      ]),
    };
    // Clone the original set for immutability check
    const originalSetA = new Set(obj.map.get("a") as Set<number>);
    const result = i(obj, (draft) => {
      (draft.map.get("a") as Set<number>).add(4);
      const innerMap = draft.map.get("b") as Map<any, any>;
      (innerMap.get("c") as Set<number>).add(6);
    });
    expect((result.map.get("a") as Set<number>).has(4)).toBe(true);
    expect((result.map.get("b") as Map<any, any>).get("c")?.has(6)).toBe(true);
    // Immutability check
    expect(Array.from(obj.map.get("a") as Set<number>)).toEqual(
      Array.from(originalSetA)
    );
  });

  it("should handle freezing deeply nested structures", () => {
    const obj = { a: { b: { c: [1, 2, 3] } } };
    const frozen = df(obj) as typeof obj;
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen((frozen as any).a)).toBe(true);
    expect(Object.isFrozen((frozen as any).a.b)).toBe(true);
    expect(Object.isFrozen((frozen as any).a.b.c)).toBe(true);
  });

  it("should not freeze when deepFreeze is false in q", () => {
    const obj = { a: 1 };
    const query = q(obj, false);
    const newObj = query.set({ a: 2 });
    expect(Object.isFrozen(newObj)).toBe(false);
  });

  it("should throw on invalid types in i", () => {
    expect(() => i(123 as any, () => {})).toThrow();
    expect(() => i("string" as any, () => {})).toThrow();
    expect(() => i(true as any, () => {})).toThrow();
  });

  it("should handle circular references gracefully in df", () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    expect(() => df(obj)).not.toThrow();
    // Should be frozen at the top level after df
    df(obj);
    expect(Object.isFrozen(obj)).toBe(true); // original should be frozen
    const frozen = df(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it("should allow querying and updating nested Maps and Sets with q", () => {
    const obj = {
      map: new Map<any, any>([
        ["a", new Set([1, 2, 3])],
        ["b", new Map<any, any>([["c", new Set([4, 5])]])],
      ]) as any,
    };
    const query = q(obj);
    const newObj = query
      .q("map")
      .set((current: Map<string, Set<number> | Map<string, Set<number>>>) => {
        const newMap = new Map(current);
        const setA = new Set(newMap.get("a") as Set<number>);
        setA.add(99);
        newMap.set("a", setA);
        return newMap;
      });
    expect((newObj.map.get("a") as Set<number>).has(99)).toBe(true);
  });

  it("should support updating arrays inside Maps and Sets", () => {
    const obj = {
      map: new Map<string, number[] | any>([["arr", [1, 2, 3]]]),
      set: new Set<any>([
        [1, 2],
        [3, 4],
      ]),
    };
    const result = i(obj, (draft) => {
      draft.map.set("arr", [4, 5, 6]);
      draft.set.forEach((arr: any) => {
        if (Array.isArray(arr)) arr.push(99);
      });
    });
    expect(result.map.get("arr")).toEqual([4, 5, 6]);
    expect(Array.from(result.set)[0]).toEqual([1, 2, 99]);
  });

  it("should not mutate original Map/Set/Array when using i", () => {
    const map = new Map<string, number>([["a", 1]]);
    const set = new Set<number>([1, 2]);
    const arr = [1, 2, 3];
    const obj = { map, set, arr };
    const result = i(obj, (draft) => {
      draft.map.set("b", 2);
      draft.set.add(3);
      draft.arr.push(4);
    });
    expect(map.has("b")).toBe(false);
    expect(set.has(3)).toBe(false);
    expect(arr.includes(4)).toBe(false);
    expect(result.map.has("b")).toBe(true);
    expect(result.set.has(3)).toBe(true);
    expect(result.arr.includes(4)).toBe(true);
  });

  it("should allow deleting properties and entries", () => {
    const obj = { a: 1, b: { c: 2 } };
    const result = i(obj, (draft) => {
      delete draft.b.c;
    });
    expect(result.b.hasOwnProperty("c")).toBe(false);

    const mapObj = {
      map: new Map<string, number>([
        ["a", 1],
        ["b", 2],
      ]),
    };
    const result2 = i(mapObj, (draft) => {
      draft.map.delete("a");
    });
    expect(result2.map.has("a")).toBe(false);

    const setObj = { set: new Set<number>([1, 2, 3]) };
    const result3 = i(setObj, (draft) => {
      draft.set = new Set([...draft.set].filter((x: number) => x !== 2));
    });
    expect(result3.set.has(2)).toBe(false);
  });

  it("should handle updateValue with various path types", () => {
    const obj = { a: { b: { c: 1 } } };
    updateValue(obj, ["a", "b", "c"], 42);
    expect(obj.a.b.c).toBe(42);
    updateValue(obj, "a.b.c", 99);
    expect(obj.a.b.c).toBe(99);
    updateValue(obj, "a.b.c", null, true);
    expect(obj.a.b.hasOwnProperty("c")).toBe(false);
  });

  it("should handle updateValue for Maps and Sets", () => {
    const map = new Map<string, { b: number }>([["a", { b: 1 }]]);
    updateValue(map, ["a", "b"], 2);
    expect((map.get("a") as { b: number }).b).toBe(2);
    updateValue(map, ["a", "b"], null, true);
    expect((map.get("a") as { b: number }).hasOwnProperty("b")).toBe(false);

    const set = new Set<any>([{ a: 1 }, { b: 2 }]);
    updateValue(set, [1, "b"], 99);
    expect((Array.from(set)[1] as any).b).toBe(99);
  });

  it("should handle shallowClone for all supported types", () => {
    const arr = [1, 2, 3];
    const arrClone = shallowClone(arr);
    expect(arrClone).not.toBe(arr);
    expect(arrClone).toEqual(arr);

    const map = new Map<string, number>([["a", 1]]);
    const mapClone = shallowClone(map);
    expect(mapClone).not.toBe(map);
    expect(mapClone.get("a")).toBe(1);

    const set = new Set<number>([1, 2]);
    const setClone = shallowClone(set);
    expect(setClone).not.toBe(set);
    expect(setClone.has(2)).toBe(true);

    const obj = { a: 1 };
    const objClone = shallowClone(obj);
    expect(objClone).not.toBe(obj);
    expect(objClone).toEqual(obj);

    const date = new Date();
    const dateClone = shallowClone(date);
    expect(dateClone).not.toBe(date);
    expect(dateClone.getTime()).toBe(date.getTime());
  });
});
