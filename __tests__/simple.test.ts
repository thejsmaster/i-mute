import { i, q, updateValue, deepClone, df } from "../index";
import { describe, it, expect, jest } from "@jest/globals";

describe("Simplified i-mute library", () => {
  describe("i function", () => {
    it("should exist", () => {
      expect(i).toBeDefined();
      expect(i).toBeInstanceOf(Function);
    });

    it("should handle simple objects", () => {
      const obj = { name: "John", age: 30 };
      const result = i(obj, (draft) => {
        draft.name = "Jane";
      });
      expect(result).toEqual({ name: "Jane", age: 30 });
      expect(obj).toEqual({ name: "John", age: 30 }); // original unchanged
    });

    it("should handle nested objects", () => {
      const obj = {
        person: {
          name: "John",
          age: 30,
          address: {
            city: "New York",
            zip: "10001",
          },
        },
      };
      const result = i(obj, (draft) => {
        draft.person.name = "Jane";
        draft.person.address.city = "Boston";
      });
      expect(result.person.name).toBe("Jane");
      expect(result.person.address.city).toBe("Boston");
      expect(obj.person.name).toBe("John"); // original unchanged
      expect(obj.person.address.city).toBe("New York"); // original unchanged
    });

    it("should handle arrays", () => {
      const obj = { items: [1, 2, 3] };
      const result = i(obj, (draft) => {
        draft.items.push(4);
        draft.items[0] = 99;
      });
      expect(result.items).toEqual([99, 2, 3, 4]);
      expect(obj.items).toEqual([1, 2, 3]); // original unchanged
    });

    it("should handle nested arrays", () => {
      const obj = {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      };
      const result = i(obj, (draft) => {
        draft.matrix[0][1] = 22;
        draft.matrix[1].push(5);
      });
      expect(result.matrix[0][1]).toBe(22);
      expect(result.matrix[1][0]).toBe(3);
      expect(result.matrix[1][1]).toBe(4);
      expect(result.matrix[1][2]).toBe(5);
      expect(obj.matrix[0][1]).toBe(2); // original unchanged
      expect(obj.matrix[1]).toEqual([3, 4]); // original unchanged
    });

    it("should handle arrays of objects", () => {
      const obj = {
        users: [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" },
        ],
      };
      const result = i(obj, (draft) => {
        draft.users[0].name = "Johnny";
        draft.users.push({ id: 3, name: "Bob" });
      });
      expect(result.users[0].name).toBe("Johnny");
      expect(result.users.length).toBe(3);
      expect(obj.users[0].name).toBe("John"); // original unchanged
      expect(obj.users.length).toBe(2); // original unchanged
    });

    it("should handle property deletion", () => {
      // Create a fresh test object
      const original = { a: 1, b: 2, c: { d: 3, e: 4 } };
      // Make a deep copy to avoid reference issues
      const obj = JSON.parse(JSON.stringify(original));

      const result = i(obj, (draft) => {
        delete draft.b;
        delete draft.c.e;
      });

      expect(result.b).toBeUndefined();
      expect(result.c.e).toBeUndefined();

      // Verify the original is unchanged
      expect(obj.b).toBe(2); // original unchanged
      expect(obj.c.e).toBe(4); // original unchanged
    });

    it("should reject non-objects", () => {
      expect(() => i(42 as any, () => {})).toThrow();
      expect(() => i("string" as any, () => {})).toThrow();
      expect(() => i(true as any, () => {})).toThrow();
    });
  });

  describe("q function", () => {
    it("should exist", () => {
      expect(q).toBeDefined();
      expect(q).toBeInstanceOf(Function);
    });

    it("should create a query object with basic methods", () => {
      const obj = { name: "John", age: 30 };
      const query = q(obj);

      expect(query).toBeDefined();
      expect(query.get).toBeInstanceOf(Function);
      expect(query.set).toBeDefined();
      expect(query.subscribe).toBeDefined();
      expect(query.q).toBeDefined();
      expect(query.getState).toBeDefined();
    });

    it("should get values from the root object", () => {
      const obj = { name: "John", age: 30 };
      const query = q(obj);

      expect(query.get()).toEqual(obj);
      expect(query.getState()).toEqual(obj);
    });

    it("should get nested values using q()", () => {
      const obj = {
        person: {
          name: "John",
          age: 30,
          address: {
            city: "New York",
          },
        },
      };
      const query = q(obj);

      expect(query.q("person").get()).toEqual(obj.person);
      expect(query.q("person").q("name").get()).toBe("John");
      expect(query.q("person").q("address").q("city").get()).toBe("New York");
    });

    it("should set values immutably", () => {
      const obj = { name: "John", age: 30 };
      const query = q(obj);

      const newObj = query.set({ name: "Jane", age: 31 });
      expect(newObj).toEqual({ name: "Jane", age: 31 });
      expect(obj).toEqual({ name: "John", age: 30 }); // original unchanged
    });

    it("should set nested values immutably", () => {
      const obj = {
        person: {
          name: "John",
          age: 30,
        },
      };
      const query = q(obj);

      const newObj = query.q("person").set({ name: "Jane", age: 31 });
      expect(newObj).toEqual({ person: { name: "Jane", age: 31 } });
      expect(obj).toEqual({ person: { name: "John", age: 30 } }); // original unchanged
    });

    it("should set values using a function", () => {
      const obj = { count: 0 };
      const query = q(obj);

      const newObj = query.set((current) => ({ count: current.count + 1 }));
      expect(newObj).toEqual({ count: 1 });
    });

    it("should notify subscribers when values change", () => {
      const obj = { name: "John" };
      const query = q(obj);
      const mockSubscriber = jest.fn();

      const unsubscribe = query.subscribe(mockSubscriber);
      query.set({ name: "Jane" });

      expect(mockSubscriber).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledWith([
        {
          path: "",
          from: "set",
          type: "update",
          value: { name: "Jane" },
        },
      ]);

      unsubscribe();
      query.set({ name: "Doe" });
      expect(mockSubscriber).toHaveBeenCalledTimes(1); // No more calls after unsubscribe
    });

    it("should deep freeze objects by default", () => {
      const obj = {
        person: {
          name: "John",
          age: 30,
        },
      };
      const query = q(obj);
      const newObj = query.set({ person: { name: "Jane", age: 31 } });

      const isFrozen = Object.isFrozen(newObj);
      expect(isFrozen || Object.isFrozen(newObj.person)).toBeTruthy();
    });

    it("should not deep freeze when deepFreeze=false", () => {
      const obj = { name: "John" };
      const query = q(obj, false);
      const newObj = query.set({ name: "Jane" });

      expect(Object.isFrozen(newObj)).toBe(false);
    });

    it("should work with arrays", () => {
      const obj = { items: [1, 2, 3] };
      const query = q(obj);

      const newObj = query.q("items").set([4, 5, 6]);
      expect(newObj).toEqual({ items: [4, 5, 6] });
      expect(obj).toEqual({ items: [1, 2, 3] }); // original unchanged
    });
  });

  describe("deepClone and circular references", () => {
    it("should handle circular references", () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const cloned = deepClone(obj);
      expect(cloned.a).toBe(1);
      expect(cloned.self).toBe(cloned); // Circular reference preserved
    });

    it("should handle nested circular references", () => {
      const obj: any = { a: { b: { c: 1 } } };
      obj.a.b.parent = obj.a;

      const cloned = deepClone(obj);
      expect(cloned.a.b.c).toBe(1);
      expect(cloned.a.b.parent).toBe(cloned.a); // Circular reference preserved
    });

    it("should handle circular references in arrays", () => {
      const arr: any[] = [1, 2, 3];
      const obj: any = { arr };
      arr.push(obj);

      const cloned = deepClone(obj);
      expect(cloned.arr[0]).toBe(1);
      expect(cloned.arr[3].arr).toBe(cloned.arr); // Circular reference preserved
    });
  });

  describe("df (deep freeze)", () => {
    it("should deep freeze objects", () => {
      const obj = { a: { b: { c: 1 } } };
      const frozen = df(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen((frozen as any).a)).toBe(true);
      expect(Object.isFrozen((frozen as any).a.b)).toBe(true);
    });

    it("should handle circular references when freezing", () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const frozen = df(obj) as any;
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen.self).toBe(frozen); // Circular reference preserved
    });

    it("should deep freeze arrays and their contents", () => {
      const obj = { arr: [1, { x: 2 }] };
      const frozen = df(obj) as any;

      expect(Object.isFrozen(frozen.arr)).toBe(true);
      expect(Object.isFrozen(frozen.arr[1])).toBe(true);
    });
  });

  describe("updateValue", () => {
    it("should update nested properties", () => {
      const obj = { a: { b: { c: 1 } } };
      updateValue(obj, "a.b.c", 2);
      expect(obj.a.b.c).toBe(2);
    });

    it("should handle array indices", () => {
      const obj = { arr: [1, 2, 3] };
      updateValue(obj, ["arr", 1], 22);
      expect(obj.arr[1]).toBe(22);
    });

    it("should handle property deletion", () => {
      const obj = { a: { b: 1, c: 2 } };
      updateValue(obj, "a.b", null, true);
      expect(obj.a.hasOwnProperty("b")).toBe(false);
    });

    it("should create intermediate objects if needed", () => {
      const obj = { a: {} };
      updateValue(obj, "a.b.c", 1);
      expect(obj.a).toHaveProperty("b");
      expect((obj.a as any).b).toHaveProperty("c");
      expect((obj.a as any).b.c).toBe(1);
    });
  });
});
