import { q } from "../index";
import { describe, it, expect, jest } from "@jest/globals";

interface UserProfile {
  name: string;
  age: number;
}

interface UserSettings {
  darkMode: boolean;
}

interface Product {
  id: number;
  product: string;
  specs?: Map<string, string>;
}

interface Tag {
  id: number;
  name: string;
}

interface ComplexValue {
  value: string;
}

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

    expect(Object.isFrozen(newObj)).toBe(true);
    expect(Object.isFrozen(newObj.person)).toBe(true);
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

  it("should work with Maps", () => {
    const obj = {
      map: new Map([["key1", "value1"]]),
    };
    const query = q(obj);

    const newObj = query.q("map").set(new Map([["key1", "value2"]]));
    expect(newObj.map.get("key1")).toBe("value2");
    expect(obj.map.get("key1")).toBe("value1"); // original unchanged
  });

  it("should work with Sets", () => {
    const obj = {
      set: new Set(["item1"]),
    };
    const query = q(obj);

    const newObj = query.q("set").set(new Set(["item1", "item2"]));
    expect(newObj.set.has("item2")).toBe(true);
    expect(obj.set.has("item2")).toBe(false); // original unchanged
  });

  it("should work with nested Maps in objects", () => {
    const obj = {
      user: {
        data: new Map<string, UserProfile | Map<string, string>>([
          ["profile", { name: "John", age: 30 }],
          ["settings", new Map([["theme", "dark"]])],
        ]),
      },
    };
    const query = q(obj);

    const newObj = query
      .q("user")
      .q("data")
      .set((current) => {
        const newMap = new Map(current);
        newMap.set("profile", { name: "Jane", age: 31 });
        return newMap;
      });

    expect((newObj.user.data.get("profile") as UserProfile).name).toBe("Jane");
    expect(obj.user.data.get("profile")).toEqual({ name: "John", age: 30 });
  });

  it("should work with nested Sets in arrays", () => {
    const obj = {
      collections: [
        new Set<string>(["a", "b"]),
        {
          items: new Set<string>(["x", "y"]),
        },
      ],
    };
    const query = q(obj);

    const newObj = query
      .q("collections")
      .set((current: typeof obj.collections) => {
        const newCollections = [...current];
        newCollections[0] = new Set([
          ...(newCollections[0] as Set<string>),
          "c",
        ]);
        const item1 = newCollections[1] as { items: Set<string> };
        newCollections[1] = {
          ...item1,
          items: new Set([...item1.items, "z"]),
        };
        return newCollections;
      });

    expect((newObj.collections[0] as Set<string>).has("c")).toBe(true);
    expect(
      (newObj.collections[1] as { items: Set<string> }).items.has("z")
    ).toBe(true);
  });

  it("should work with Maps containing Sets", () => {
    const obj = {
      data: new Map<string, Set<number> | Set<string>>([
        ["set1", new Set([1, 2])],
        ["set2", new Set(["a", "b"])],
      ]),
    };
    const query = q(obj);

    const newObj = query.q("data").set((current) => {
      const newMap = new Map(current);
      const numSet = newMap.get("set1") as Set<number>;
      newMap.set("set1", new Set([...numSet, 3]));
      return newMap;
    });

    expect((newObj.data.get("set1") as Set<number>).has(3)).toBe(true);
  });

  it("should work with Sets containing Maps", () => {
    const obj = {
      data: new Set<Map<string, string>>([
        new Map([["key1", "value1"]]),
        new Map([["key2", "value2"]]),
      ]),
    };
    const query = q(obj);

    // Convert to array and back for manipulation
    const dataArray = Array.from(query.get().data);
    const mapToUpdate = dataArray[0];
    const updatedMap = new Map(mapToUpdate);
    updatedMap.set("key1", "updated");

    dataArray[0] = updatedMap;

    const newObj = query.q("data").set(() => new Set(dataArray));

    expect([...newObj.data][0].get("key1")).toBe("updated");
  });

  it("should work with deeply nested Map/Set combinations", () => {
    type NestedItem = { id: number; data: Map<string, string> };

    const obj = {
      level1: {
        level2: new Map<
          string,
          Set<NestedItem> | Array<Map<string, Set<number>>>
        >([
          [
            "set",
            new Set<NestedItem>([
              { id: 1, data: new Map([["nested", "value"]]) },
            ]),
          ],
          [
            "array",
            [new Map<string, Set<number>>([["set", new Set([1, 2, 3])]])],
          ],
        ]),
      },
    };
    const query = q(obj);

    // Deep modification
    const newObj = query
      .q("level1")
      .q("level2")
      .set((current: typeof obj.level1.level2) => {
        const newMap = new Map(current);

        // Update Set in Map
        const setData = newMap.get("set") as Set<NestedItem>;
        const newSet = new Set<NestedItem>([...setData]);
        const firstItem = [...newSet][0];
        const newItem = {
          ...firstItem,
          data: new Map(firstItem.data).set("nested", "new value"),
        };
        newSet.delete(firstItem);
        newSet.add(newItem);
        newMap.set("set", newSet);

        // Update array in Map
        const arrayData = newMap.get("array") as Array<
          Map<string, Set<number>>
        >;
        const newArray = [...arrayData];
        const newInnerMap = new Map(newArray[0]);
        const setVal = newInnerMap.get("set") as Set<number>;
        newInnerMap.set("set", new Set([...setVal, 4]));
        newArray[0] = newInnerMap;
        newMap.set("array", newArray);

        return newMap;
      });

    // Verify changes
    const setData = newObj.level1.level2.get("set") as Set<NestedItem>;
    expect([...setData][0].data.get("nested")).toBe("new value");

    const arrayData = newObj.level1.level2.get("array") as Array<
      Map<string, Set<number>>
    >;
    const innerSet = arrayData[0].get("set") as Set<number>;
    expect(innerSet.has(4)).toBe(true);

    // Verify originals unchanged
    const origSetData = obj.level1.level2.get("set") as Set<NestedItem>;
    expect([...origSetData][0].data.get("nested")).toBe("value");

    const origArrayData = obj.level1.level2.get("array") as Array<
      Map<string, Set<number>>
    >;
    const origInnerSet = origArrayData[0].get("set") as Set<number>;
    expect(origInnerSet.has(4)).toBe(false);
  });

  it("should handle complex nested structures with mixed types", () => {
    const obj = {
      a: new Map([
        [
          "b",
          [
            {
              c: new Set([new Map([["d", "value"]])]),
            },
          ],
        ],
      ]),
    };
    const query = q(obj);

    const newObj = query.q("a").set((current) => {
      const newMap = new Map(current);
      const newArray = [...newMap.get("b")];
      const newObject = { ...newArray[0] };
      const newSet = new Set([...newObject.c]);
      const newInnerMap = new Map([...newSet][0]);
      newInnerMap.set("d", "updated");
      newSet.delete([...newSet][0]);
      newSet.add(newInnerMap);
      newObject.c = newSet;
      newArray[0] = newObject;
      newMap.set("b", newArray);
      return newMap;
    });

    expect([...newObj.a.get("b")][0].c.values().next().value.get("d")).toBe(
      "updated"
    );
    expect([...obj.a.get("b")][0].c.values().next().value.get("d")).toBe(
      "value"
    );
  });

  it("should query into Map values directly", () => {
    const obj = {
      data: new Map<string, UserProfile>([
        ["user1", { name: "John", age: 30 }],
        ["user2", { name: "Jane", age: 25 }],
      ]),
    };
    const query = q(obj);

    const newObj = query
      .q("data")
      .q("user1")
      .set((current: UserProfile) => ({ name: current.name, age: 31 }));

    expect(newObj.data.get("user1")).toEqual({ name: "John", age: 31 });
  });

  it("should query through nested Maps", () => {
    const obj = {
      users: new Map<string, Map<string, UserProfile | UserSettings>>([
        [
          "id1",
          new Map([
            ["profile", { name: "Alice", age: 30 }],
            ["settings", { darkMode: true }],
          ]),
        ],
      ]),
    };
    const query = q(obj);

    const newObj = query
      .q("users")
      .q("id1")
      .q("settings")
      .set((current: UserSettings) => ({ ...current, darkMode: false }));

    expect(newObj.users.get("id1")?.get("settings")).toEqual({
      darkMode: false,
    });
  });

  it("should query into Set values with conversion", () => {
    interface Tag {
      id: number;
      name: string;
    }

    const obj = {
      tags: new Set<Tag>([
        { id: 1, name: "important" },
        { id: 2, name: "urgent" },
      ]),
    };
    const query = q(obj);

    const tagArray = Array.from(query.get().tags);
    const tagQuery = q({ array: tagArray });

    const newTagArray = tagQuery
      .q("array")
      .q(0)
      .set((current: Tag) => ({ ...current, name: "critical" }));

    const newObj = {
      tags: new Set(newTagArray.array),
    };

    const firstTag = Array.from(newObj.tags)[0] as Tag;
    expect(firstTag.name).toBe("critical");
  });

  it("should handle mixed Map/Set/object nesting", () => {
    type Product = { id: number; product: string; specs?: Map<string, string> };

    const obj = {
      store: new Map<string, Map<string, Set<Product>>>([
        [
          "departments",
          new Map<string, Set<Product>>([
            [
              "electronics",
              new Set<Product>([
                {
                  id: 1,
                  product: "TV",
                  specs: new Map<string, string>([["resolution", "4K"]]),
                },
                { id: 2, product: "Laptop" },
              ]),
            ],
            ["clothing", new Set<Product>([{ id: 3, product: "Shirt" }])],
          ]),
        ],
      ]),
    };
    const query = q(obj);

    // Update more directly with a more structured approach
    const newObj = query.set((current) => {
      const newStore = new Map(current.store);
      const departments = new Map(newStore.get("departments"));

      // Get the electronics set
      const electronics = new Set(departments.get("electronics"));

      // Convert to array for easier manipulation
      const electronicsArray = Array.from(electronics);
      const tvProduct = electronicsArray[0];

      // Create updated TV product with 8K resolution
      const updatedTvProduct = {
        ...tvProduct,
        specs: new Map(tvProduct.specs).set("resolution", "8K"),
      };

      // Replace the first item
      electronicsArray[0] = updatedTvProduct;

      // Update all the way back up
      departments.set("electronics", new Set(electronicsArray));
      newStore.set("departments", departments);

      return {
        ...current,
        store: newStore,
      };
    });

    const departments = newObj.store.get("departments");
    if (!departments) throw new Error("Departments not found");

    const electronics = departments.get("electronics");
    if (!electronics) throw new Error("Electronics not found");

    const updatedItem = [...electronics][0];
    expect(updatedItem.specs?.get("resolution")).toBe("8K");

    const origDepartments = obj.store.get("departments");
    if (!origDepartments) throw new Error("Original departments not found");

    const origElectronics = origDepartments.get("electronics");
    if (!origElectronics) throw new Error("Original electronics not found");

    const origItem = [...origElectronics][0];
    expect(origItem.specs?.get("resolution")).toBe("4K");
  });

  it("should query Map entries with non-string keys", () => {
    const keyObj = { id: 123 };
    const obj = {
      complexMap: new Map<{ id: number } | Date, { value: string }>([
        [keyObj, { value: "test" }],
        [new Date(2020, 0, 1), { value: "date" }],
      ]),
    };
    const query = q(obj);

    // We'll use a string accessor and then check the result manually
    const newObj = query.q("complexMap").set((current) => {
      const newMap = new Map(current);
      // Find and update the entry with keyObj
      newMap.set(keyObj, { value: "updated" });
      return newMap;
    });

    expect(newObj.complexMap.get(keyObj)).toEqual({ value: "updated" });
    expect(obj.complexMap.get(keyObj)).toEqual({ value: "test" }); // original unchanged
  });

  it("should handle querying through array of Maps", () => {
    interface MapData {
      timestamp: number;
      data: { value: number };
    }

    const obj = {
      history: [
        new Map<string, number | { value: number }>([
          ["timestamp", 123456],
          ["data", { value: 1 }],
        ]),
        new Map<string, number | { value: number }>([
          ["timestamp", 789012],
          ["data", { value: 2 }],
        ]),
      ],
    };
    const query = q(obj);

    // Query through array and update through a method
    const newObj = query.q("history").set((current) => {
      const newArray = [...current];
      const firstMap = newArray[0];
      const newMap = new Map(firstMap);
      const dataObj = newMap.get("data") as { value: number };
      newMap.set("data", { value: 10 });
      newArray[0] = newMap;
      return newArray;
    });

    const dataFromMap = newObj.history[0].get("data");
    expect(dataFromMap).toEqual({ value: 10 });
    expect(obj.history[0].get("data")).toEqual({ value: 1 }); // original unchanged
  });
});
