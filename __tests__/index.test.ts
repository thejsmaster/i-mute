import { df, i, isValidObject } from "../index";
import { describe, it, expect, test } from "@jest/globals";
// or if you prefer imports:
// import { i } from '../index';

interface Draft {
  name: string;
  age: number;
  address?:
    | {
        street: string;
        city: string;
        state: string;
        zip: string;
      }
    | Map<string, string>
    | Set<string>;
  birthday?: Date;
}

describe("i function", () => {
  test("should exist", () => {
    expect(i).toBeDefined();
  });

  // Add your other tests here
});

describe("i", () => {
  it("should be a function", () => {
    expect(i).toBeInstanceOf(Function);
  });
});

describe("i", () => {
  it("i accepts objects", () => {
    const obj = {
      name: "John",
      age: 30,
    };
    const result = i(obj, (draft: Draft) => {
      draft.name = "Jane";
    });
    expect(result).toEqual({
      name: "Jane",
      age: 30,
    });
  });
});

describe("i updates a nested object and returns the new object", () => {
  it("should update a nested object", () => {
    const obj = {
      name: "John",
      age: 30,
      address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "12345",
      },
    };
    const result = i(obj, (draft) => {
      draft.address.city = "Anytown";
    });
    expect(result).toEqual({
      name: "John",
      age: 30,
      address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "12345",
      },
    });
  });
});

describe("i works with map or set values in nested objects", () => {
  it("should work with map", () => {
    const obj = {
      name: "John",
      age: 30,
      address: new Map([
        ["street", "123 Main St"],
        ["city", "test"],
        ["state", "CA"],
        ["zip", "12345"],
      ]),
    };
    const result = i(obj, (draft) => {
      draft.address.set("city", "Anytown");
    });
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        name: "John",
        age: 30,
        address: new Map([
          ["street", "123 Main St"],
          ["city", "Anytown"],
          ["state", "CA"],
          ["zip", "12345"],
        ]),
      })
    );
  });

  it("should handle deleting a Map entry", () => {
    const obj = {
      data: new Map([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]),
    };
    const result = i(obj, (draft) => {
      draft.data.delete("b");
    });

    // Verify deletion in new Map
    expect(result.data.has("b")).toBe(false);
    expect(result.data.get("a")).toBe(1);
    expect(result.data.size).toBe(2);

    // Verify new Map instance was created
    expect(result.data).not.toBe(obj.data);

    // Verify original remains unchanged
    expect(obj.data.has("b")).toBe(true);
    expect(obj.data.size).toBe(3);
  });
});

describe("i works with set values in nested objects", () => {
  it("should work with set", () => {
    const obj = {
      name: "John",
      age: 30,
      address: new Set(["123 Main St", "test", "CA", "12345"]),
    };
    const result = i(obj, (draft) => {
      draft.address.add("Anytown");
    });
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        name: "John",
        age: 30,
        address: new Set(["123 Main St", "test", "CA", "12345", "Anytown"]),
      })
    );
  });

  it("should handle deleting a Set entry", () => {
    const obj = {
      data: new Set(["a", "b", "c"]),
    };
    const result = i(obj, (draft) => {
      draft.data.delete("b");
    });

    // Verify deletion in new Set
    expect(result.data.has("b")).toBe(false);
    expect(result.data.size).toBe(2);
    expect([...result.data]).toEqual(expect.arrayContaining(["a", "c"]));

    // Verify new Set instance was created
    expect(result.data).not.toBe(obj.data);

    // Verify original remains unchanged
    expect(obj.data.has("b")).toBe(true);
    expect(obj.data.size).toBe(3);
  });
});

describe("i works with date manipulations", () => {
  it("should work with date", () => {
    const initialDate = new Date(2000, 0, 1); // Jan 1, 2000
    const obj = {
      name: "John",
      age: 30,
      birthday: initialDate,
    };
    const result = i(obj, (draft) => {
      draft.birthday.setFullYear(1990);
    });
    expect(result.birthday.getFullYear()).toBe(1990);
    expect(result.birthday.getMonth()).toBe(0);
    expect(result.birthday.getDate()).toBe(1);
    expect(obj !== result).toBe(true);
    // Verify original wasn't modified
    expect(initialDate.getFullYear()).toBe(2000);
  });
});

// testing immutability with nested objects where maps and sets are involved
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
    const newobject = i(obj, (draft) => {
      draft.test.a.b.c.d = 12;
    });

    expect(newobject.test === test).toBe(false);
    expect(newobject.test.b === test.b).toBe(true);
    expect(newobject.address === address).toBe(true);
    expect(newobject.test.a !== test.a).toBe(true);
    expect(newobject.test.a.b !== test.a.b).toBe(true);
    expect(newobject.test.a.b.c !== test.a.b.c).toBe(true);
    expect(newobject.test.a.b.e === test.a.b.e).toBe(true);

    const newobject2 = i(newobject, (draft) => {
      draft.test.a.b.a[0].g = 12;
    });
    expect(newobject2.test.a.b.a[0].g).toBe(12);
    expect(newobject2.test.a.b.a[0] !== newobject.test.a.b.a[0]).toBe(true);
    expect(newobject2.test.a.b.a[0].f === newobject.test.a.b.a[0].f).toBe(true);

    const newobject3 = i(newobject2, (draft) => {
      draft.test.a.b.a[1].m?.set("a", {
        address: { street: 10 },
        test: {},
      });
    });
    expect(newobject3.test.a.b.a[1]?.m?.get("a")?.address?.street).toBe(10);
    expect(
      newobject3.test.a.b.a[1]?.m?.get("a")?.test !==
        newobject2.test.a.b.a[1]?.m?.get("a")?.test
    ).toBe(true);
    expect(newobject3.test.a.b.a[1]?.m !== newobject2.test.a.b.a[1]?.m).toBe(
      true
    );

    const newobject4 = i(newobject3, (draft) => {
      const address = draft.test.a.b.a[1].m?.get("a")?.address;
      if (address) {
        address.street = 12;
      }
    });
    expect(newobject4.test.a.b.a[1]?.m?.get("a")?.address?.street).toBe(12);
    expect(newobject4.test.a.b.a[1]?.m !== newobject3.test.a.b.a[1]?.m).toBe(
      true
    );
  });
});

// write a similar test case with arrays involved
describe("i works with arrays", () => {
  it("should work with arrays", () => {
    const obj = {
      name: "John",
      age: 30,
      address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "12345",
        dob: new Date(2000, 0, 1),
      },
      test: [
        {
          a: 1,
          b: 2,
        },
        {
          e: new Map([
            ["street", "123 Main St"],
            ["city", "Anytown"],
            ["state", "CA"],
            ["zip", "12345"],
          ]),
          d: new Set(["123 Main St", "test", "CA", "12345"]),
          c: {
            d: 10,
          },
        },
      ],
    };

    const newobject = i(obj, (draft) => {
      draft.test[0].a = 12;
      draft.test[1].e?.set("street", "new street");
      draft.test[1].d?.add("new town");
      draft.test[1].c!.d = 12;
      draft.address.dob.setFullYear(1990);
    });
    // expect to have new refs for objects whose chldren are changed
    expect(newobject.test[0].a).toBe(12);
    expect(newobject.test[0] !== obj.test[0]).toBe(true);
    expect(newobject.test[1].e?.get("street")).toBe("new street");
    expect(newobject.test[1].e !== obj.test[1].e).toBe(true);
    expect(newobject.test[1].d?.has("new town")).toBe(true);
    expect(newobject.test[1].d !== obj.test[1].d).toBe(true);
    expect(newobject.test[1].c?.d).toBe(12);
    expect(newobject.test[1].c !== obj.test[1].c).toBe(true);
    expect(newobject.address.dob.getFullYear()).toBe(1990);
    expect(newobject.address.dob !== obj.address.dob).toBe(true);
  });
});

describe("i edge cases", () => {
  describe("handles null and undefined", () => {
    it("should throw when input is null", () => {
      expect(() => i(null, (draft) => {})).toThrow(
        "Only objects, arrays, maps and sets are supported"
      );
    });

    it("should throw when input is undefined", () => {
      expect(() => i(undefined, (draft) => {})).toThrow(
        "Only objects, arrays, maps and sets are supported"
      );
    });
  });

  describe("works with frozen objects", () => {
    it("should handle frozen objects", () => {
      const obj = Object.freeze({ a: 1, b: 2 });
      const result = i(obj, (draft) => {
        //@ts-ignore
        draft.a = 3;
      });
      expect(result.a).toBe(3);
      expect(obj.a).toBe(1);
    });
  });

  // Add the rest of the edge case tests here...
});

describe("i works with deeply frozen nested objects", () => {
  it("should handle updates in deeply frozen objects with Maps/Sets", () => {
    // 1. Create a large, complex object
    const obj = {
      id: 1,
      metadata: new Map<any, any>([
        ["createdAt", new Date(2020, 0, 1)],
        ["tags", new Set(["urgent", "backend"])],
      ]),
      nested: {
        config: {
          permissions: new Map([
            ["admin", true],
            ["user", false],
          ]),
          flags: new Set([1, 2, 3]),
        },
        data: [
          { id: 1, value: "A" },
          { id: 2, value: "B" },
        ],
      },
    };

    // 2. Deep freeze the entire object
    const frozenObj: any = df(obj);

    // 3. Perform multiple mutations in one producer
    const result = i(frozenObj, (draft: any) => {
      // Update Map
      draft.metadata.get("createdAt")?.setFullYear(2023);
      draft.metadata.set("updatedAt", new Date());
      draft.nested.config.permissions.set("user", true);

      // Update Set
      draft.metadata.get("tags")?.add("high-priority");
      draft.nested.config.flags.delete(2);

      // Update plain object/array
      draft.nested.data[0].value = "Z";
      draft.nested.newProp = "test";
    });

    // 4. Verify all changes
    // Maps
    expect(result.metadata.get("createdAt")?.getFullYear()).toBe(2023);
    expect(result.metadata.has("updatedAt")).toBe(true);
    expect(result.nested.config.permissions.get("user")).toBe(true);

    // Sets
    expect(result.metadata.get("tags")?.has("high-priority")).toBe(true);
    expect(result.nested.config.flags.has(2)).toBe(false);

    // Objects/Arrays
    expect(result.nested.data[0].value).toBe("Z");
    expect(result.nested.newProp).toBe("test");

    // 5. Verify original is untouched
    expect(frozenObj.metadata.has("updatedAt")).toBe(false);
    expect(frozenObj.nested.config.permissions.get("user")).toBe(false);
    expect(frozenObj.nested.data[0].value).toBe("A");
    expect("newProp" in frozenObj.nested).toBe(false);

    // 6. Verify immutability (new references)
    expect(result).not.toBe(frozenObj);
    expect(result.metadata).not.toBe(frozenObj.metadata);
    expect(result.nested.config.permissions).not.toBe(
      frozenObj.nested.config.permissions
    );
  });
});
