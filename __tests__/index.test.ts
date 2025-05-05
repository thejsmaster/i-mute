import { i } from "../index";
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
