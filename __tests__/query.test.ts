import { q, df } from "../index";
import { describe, it, expect, jest, test } from "@jest/globals";

describe("q function", () => {
  test("basic initialization", () => {
    const obj = { name: "John", age: 30 };
    const query = q(obj);
    expect(query.getState()).toEqual(obj);
  });

  test("getting values", () => {
    const obj = { name: "John", age: 30 };
    const query = q(obj);
    expect(query.get()).toEqual(obj);
    expect(query.q("name").get()).toBe("John");
    expect(query.q("age").get()).toBe(30);
  });

  test("setting values", () => {
    const obj = { name: "John", age: 30 };
    const query = q(obj);

    // Set value directly
    query.q("name").set("Jane");
    expect(query.q("name").get()).toBe("Jane");

    // Original object should be unmodified
    expect(obj.name).toBe("John");
  });

  test("subscribing to changes", () => {
    const obj = { name: "John", age: 30 };
    const query = q(obj);

    const mockCallback = jest.fn();
    const unsubscribe = query.q("name").subscribe(mockCallback);

    query.q("name").set("Jane");

    expect(mockCallback).toHaveBeenCalledTimes(1);

    // Check the callback arguments
    expect(mockCallback).toHaveBeenCalledWith([
      { path: "name", from: "set", type: "update", value: "Jane" },
    ]);

    // Test unsubscribe
    unsubscribe();
    query.q("name").set("Bob");
    expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
  });

  test("chaining q methods to access nested properties", () => {
    const obj = {
      user: {
        profile: {
          name: "John",
          contact: {
            email: "john@example.com",
          },
        },
      },
    };

    const query = q(obj);
    expect(query.q("user").q("profile").q("name").get()).toBe("John");
    expect(query.q("user").q("profile").q("contact").q("email").get()).toBe(
      "john@example.com"
    );

    // Update deeply nested property
    query
      .q("user")
      .q("profile")
      .q("contact")
      .q("email")
      .set("jane@example.com");
    expect(query.q("user").q("profile").q("contact").q("email").get()).toBe(
      "jane@example.com"
    );
  });

  test("using functions with set", () => {
    const obj = { counter: 5 };
    const query = q(obj);

    // Use function to update value
    query.q("counter").set((current) => current + 1);
    expect(query.q("counter").get()).toBe(6);

    // Test with more complex update logic
    query.q("counter").set((current) => current * 2);
    expect(query.q("counter").get()).toBe(12);
  });

  test("deepFreeze parameter", () => {
    // Test with deepFreeze = true (default)
    const obj1 = { user: { name: "John" } };
    const query1 = q(obj1);
    query1.q("user").q("name").set("Jane");
    const state1 = query1.getState();
    expect(Object.isFrozen(state1)).toBe(true);
    expect(Object.isFrozen(state1.user)).toBe(true);

    // Test with deepFreeze = false
    const obj2 = { user: { name: "John" } };
    const query2 = q(obj2, false);
    query2.q("user").q("name").set("Jane");
    const state2 = query2.getState();
    expect(Object.isFrozen(state2)).toBe(false);
  });

  test("works with arrays", () => {
    const obj = { items: [1, 2, 3] };
    const query = q(obj);

    // Get array element
    expect(query.q("items").get()[0]).toBe(1);

    // Update array element
    query.q("items").set([4, 5, 6]);
    expect(query.q("items").get()).toEqual([4, 5, 6]);
  });

  test("works with Maps and Sets", () => {
    const map = new Map([
      ["key1", "value1"],
      ["key2", "value2"],
    ]);
    const set = new Set(["item1", "item2"]);
    const obj = {
      data: {
        map: map,
        set: set,
      },
    };

    const query = q(obj);

    // Update Map and Set through separate updates
    const updatedObj = {
      data: {
        map: new Map([
          ["key1", "updatedValue1"],
          ["key2", "value2"],
        ]),
        set: new Set(["item1", "item2", "item3"]),
      },
    };

    query.q("data").set(updatedObj.data);

    // Check Map was updated
    expect(query.q("data").q("map").get().get("key1")).toBe("updatedValue1");

    // Check Set was updated
    expect(query.q("data").q("set").get().has("item3")).toBe(true);
  });

  test("handling root-level updates", () => {
    const obj = { a: 1, b: 2 };
    const query = q(obj);

    const mockCallback = jest.fn();
    query.subscribe(mockCallback);

    // Replace entire state
    const newState = { a: 3, b: 4, c: 5 };
    query.set(newState);

    expect(query.getState()).toEqual(newState);
    expect(mockCallback).toHaveBeenCalledWith([
      { path: "", from: "set", type: "update", value: newState },
    ]);
  });

  test("works with complex nested structures", () => {
    const complex = {
      users: [
        { id: 1, name: "John", roles: ["admin", "user"] },
        { id: 2, name: "Jane", roles: ["user"] },
      ],
      settings: {
        theme: {
          dark: true,
          colors: {
            primary: "#000",
            secondary: "#fff",
          },
        },
      },
    };

    const query = q(complex);

    // Test getting nested values
    expect(query.q("users").get()[0].name).toBe("John");
    expect(query.q("settings").q("theme").q("colors").q("primary").get()).toBe(
      "#000"
    );

    // Test updating nested values
    query.q("settings").q("theme").q("colors").q("primary").set("#333");
    expect(query.q("settings").q("theme").q("colors").q("primary").get()).toBe(
      "#333"
    );

    // Test modifying array elements
    const updatedUsers = [
      { id: 1, name: "Johnny", roles: ["admin", "user"] },
      { id: 2, name: "Jane", roles: ["user"] },
      { id: 3, name: "Bob", roles: ["guest"] },
    ];

    query.q("users").set(updatedUsers);
    expect(query.q("users").get().length).toBe(3);
    expect(query.q("users").get()[0].name).toBe("Johnny");
  });
});
