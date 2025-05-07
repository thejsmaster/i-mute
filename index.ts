// i behaves like immer.
export function i<T>(currentState: T, producer: (draft: T) => void): T {
  // only supports objects and arrays
  if (
    !isValidObject(currentState) ||
    currentState === null ||
    currentState === undefined
  ) {
    throw new Error("Only objects and arrays are supported");
  }
  // Create a deep clone to ensure complete isolation from the original
  const newState = deepClone(currentState);
  const draft = createStateProxy(newState, "") as unknown as T;
  producer(draft);

  function createStateProxy<S>(obj: S, path = ""): S {
    //@ts-ignore
    return new Proxy(obj, {
      get(target, key) {
        // Handle symbol keys safely
        if (typeof key === "symbol") {
          //@ts-ignore
          return target[key];
        }
        const fullPath = path ? `${path}.${key}` : key;
        //@ts-ignore
        let value = target[key];

        if (typeof value === "object" && value !== null) {
          return createStateProxy(
            Object.isFrozen(value)
              ? Array.isArray(value)
                ? [...value]
                : { ...value }
              : value,
            fullPath
          );
        } else {
          return value;
        }
      },
      set(_target, key, value) {
        // Handle symbol keys safely
        if (typeof key === "symbol") {
          //@ts-ignore
          _target[key] = value;
          return true;
        }
        const fullPath = path ? `${path}.${key}` : key;
        updateValue(newState, fullPath ? fullPath.split(".") : [key], value);
        return true;
      },
      deleteProperty(target, key) {
        // Handle symbol keys safely
        if (typeof key === "symbol") {
          //@ts-ignore
          delete target[key];
          return true;
        }
        const fullPath = path ? `${path}.${key}` : key;
        updateValue(
          newState,
          fullPath ? fullPath.split(".") : [key],
          null,
          true
        );
        //@ts-ignore
        delete target[key];
        return true;
      },
    });
  }
  alreadyDestructuredPaths = [];
  return newState;
}

export function shallowClone<T>(currentState: T): T {
  if (Array.isArray(currentState)) {
    return [...currentState] as T;
  } else if (typeof currentState === "object" && currentState !== null) {
    return { ...currentState };
  }
  return currentState;
}

export let alreadyDestructuredPaths: string[] = [];

export function isValidObject(value: any) {
  if (value === undefined || value === null) return true;

  if (typeof value !== "object") return false;

  const tag = Object.prototype.toString.call(value);

  // List of types to reject
  const invalidTags = new Set([
    "[object Map]",
    "[object Set]",
    "[object Date]",
    "[object Promise]",
    "[object RegExp]",
    "[object Error]",
    "[object BigInt]",
    "[object ArrayBuffer]",
    "[object DataView]",
    "[object Int8Array]",
    "[object Uint8Array]",
    "[object Uint8ClampedArray]",
    "[object Int16Array]",
    "[object Uint16Array]",
    "[object Int32Array]",
    "[object Uint32Array]",
    "[object Float32Array]",
    "[object Float64Array]",
    "[object SharedArrayBuffer]",
    "[object Atomics]",
    "[object FinalizationRegistry]",
    "[object WeakRef]",
  ]);

  return !invalidTags.has(tag);
}

export function updateValue(
  obj: any,
  path: string | number | (string | number)[],
  val: any,
  isDelete: boolean = false
): void {
  if (typeof obj !== "object" || obj === null) return;

  // Convert path to array if it's not already
  const keys: (string | number)[] = Array.isArray(path)
    ? path
    : typeof path === "string"
    ? path.split(".")
    : [path];

  let current = obj;

  for (let i = 0; i < keys.length; i++) {
    const key: string | number = keys[i];
    const isLast = i === keys.length - 1;

    if (Array.isArray(current)) {
      // Use numeric key only for arrays
      const numKey = typeof key === "string" ? Number(key) : key;
      if (isLast) {
        if (isDelete) {
          current.splice(numKey, 1);
        } else {
          current[numKey] = val;
        }
      } else {
        if (
          typeof current[key as number] !== "object" ||
          current[key as number] === null
        ) {
          current[key as number] = {};
        } else if (Array.isArray(current[key as number])) {
          current[key as number] = [...current[key as number]];
        } else {
          current[key as number] = { ...current[key as number] };
        }
        current = current[key as number];
      }
    } else if (typeof current === "object") {
      // Use key directly without conversion for objects
      if (isLast) {
        if (isDelete) {
          delete current[key];
        } else {
          current[key] = val;
        }
      } else {
        if (typeof current[key] !== "object" || current[key] === null) {
          current[key] = {};
        } else if (Array.isArray(current[key])) {
          current[key] = [...current[key]];
        } else {
          current[key] = { ...current[key] };
        }
        current = current[key];
      }
    } else {
      // Non-traversable type
      return;
    }
  }
}

// Helper function to deeply clone any value (without circular reference handling)
export function deepClone<T>(value: T): T {
  // Handle primitive types, null, and undefined
  if (value === null || typeof value !== "object") {
    return value;
  }

  // Add circular reference handling back
  const seen = new WeakMap();

  function clone(item: any): any {
    if (item === null || typeof item !== "object") {
      return item;
    }

    // Handle circular references
    if (seen.has(item)) {
      return seen.get(item);
    }

    // Handle Arrays
    if (Array.isArray(item)) {
      const copy: any[] = [];
      seen.set(item, copy);

      item.forEach((val, index) => {
        copy[index] = clone(val);
      });

      return copy;
    }

    // Handle plain objects
    const copy: any = {};
    seen.set(item, copy);

    Object.keys(item).forEach((key) => {
      copy[key] = clone(item[key]);
    });

    return copy;
  }

  return clone(value);
}

// Simplified df to only handle objects and arrays without circular reference handling
export function df<T>(obj: any): T {
  if (obj === null || typeof obj !== "object") {
    return obj as T;
  }

  // Create a deep copy
  const copy = deepClone(obj);

  // Use WeakSet to track objects already frozen to avoid circular references
  const seen = new WeakSet();

  function freeze(object: any) {
    // Avoid infinite recursion with circular references
    if (object === null || typeof object !== "object" || seen.has(object)) {
      return object;
    }

    seen.add(object);

    if (Array.isArray(object)) {
      object.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          object[index] = freeze(item);
        }
      });
    } else {
      Object.keys(object).forEach((key) => {
        if (typeof object[key] === "object" && object[key] !== null) {
          object[key] = freeze(object[key]);
        }
      });
    }

    return Object.freeze(object);
  }

  return freeze(copy) as T;
}

export function q<T>(obj: T, deepFreeze: boolean = true): Query<T> {
  const root = {
    subs: new Set<any>(),
    value: deepFreeze ? df(obj) : obj,
    deepFreeze,
    get() {
      return this.value;
    },
    subscribe(
      fn: (
        changes?: { path: string; from: "set"; type: "update"; value: T }[]
      ) => void
    ) {
      this.subs.add(fn);
      return () => {
        this.subs.delete(fn);
      };
    },
    set(path: string, _obj: any) {
      this.value = _obj;
      this.subs.forEach((fn) =>
        fn([{ path, from: "set", type: "update", value: _obj }])
      );
    },
  };
  return new Query("", root);
}

const getValueFromPath = (obj: any, path: string) => {
  if (path === "") {
    return obj;
  }

  const keys = path.split(".");
  let currentObj = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (typeof currentObj === "object" && currentObj !== null) {
      // Regular object or array
      currentObj = currentObj[key];
    } else {
      // Hit a primitive or null before reaching the end of the path
      return undefined;
    }

    // If we hit undefined or null, stop traversing
    if (currentObj === undefined || currentObj === null) {
      return currentObj;
    }
  }

  return currentObj;
};

export class Query<T> {
  path = "";
  rootObj: any = null;
  constructor(_path: string = "", _rootObj: any) {
    this.path = _path;
    this.rootObj = _rootObj;
  }

  q<K extends keyof T>(key: K): Query<T[K]>;
  q<V>(key: string | number | symbol): Query<V>;
  q(key: string | number | symbol): Query<any> {
    const path = this.path + "." + String(key);
    return new Query(path, this.rootObj);
  }

  set(value: T | ((currentValue: T) => T)): any {
    // Handle empty path (root level) differently
    if (this.path === "") {
      const currentValue = this.get();
      const newVal =
        typeof value === "function" ? (value as Function)(currentValue) : value;
      this.rootObj.value = this.rootObj.deepFreeze ? df(newVal) : newVal;

      this.rootObj.subs.forEach((fn: any) =>
        fn([
          { path: "", from: "set", type: "update", value: this.rootObj.value },
        ])
      );
      return this.rootObj.value;
    }

    // For nested paths
    const updatedRootObject: any = Array.isArray(this.rootObj.value)
      ? [...this.rootObj.value]
      : { ...(this.rootObj.value || {}) };

    const pathWithoutLeadingDot = this.path.startsWith(".")
      ? this.path.slice(1)
      : this.path;
    const currentValue = this.get();

    updateValue(
      updatedRootObject,
      pathWithoutLeadingDot,
      typeof value === "function" ? (value as Function)(currentValue) : value
    );

    if (this.rootObj.deepFreeze) {
      this.rootObj.value = df(updatedRootObject);
    } else {
      this.rootObj.value = updatedRootObject;
    }

    this.rootObj.subs.forEach((fn: any) =>
      fn([
        {
          path: pathWithoutLeadingDot,
          from: "set",
          type: "update",
          value: this.rootObj.value,
        },
      ])
    );

    return this.rootObj.value;
  }

  get(): T {
    if (this.path === "") {
      return this.rootObj.value;
    }

    const pathWithoutLeadingDot = this.path.startsWith(".")
      ? this.path.slice(1)
      : this.path;
    return getValueFromPath(this.rootObj.value, pathWithoutLeadingDot);
  }

  subscribe(
    fn: (
      changes?: { path: string; from: "set"; type: "update"; value: T }[]
    ) => void
  ) {
    return this.rootObj.subscribe(fn);
  }

  getState() {
    return this.rootObj.value;
  }
}
