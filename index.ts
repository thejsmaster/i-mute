// i behaves like immer. can you make it support map and set?
export function i<T>(currentState: T, producer: (draft: T) => void): T {
  // now supports objects, arrays, maps and sets
  if (
    !isValidObject(currentState) ||
    currentState === null ||
    currentState === undefined
  ) {
    throw new Error("Only objects, arrays, maps and sets are supported");
  }
  const newState = shallowClone(currentState);
  const draft = createStateProxy(newState, "") as unknown as T;
  producer(draft);

  function createStateProxy<S>(obj: S, path = ""): S {
    //@ts-ignore
    return new Proxy(obj, {
      get(target, key: string) {
        const fullPath = path ? `${path}.${key}` : key;
        //@ts-ignore
        let value = target[key];

        // Handle Map methods
        //@ts-ignore
        if (target instanceof Map && typeof target[key] === "function") {
          return function (...args: any[]) {
            const newMap = new Map(target);
            const result = (
              newMap[key as keyof Map<any, any>] as Function
            ).apply(newMap, args);
            updateValue(newState, path ? path.split(".") : [], newMap);
            return key === "get" ||
              key === "has" ||
              key === "entries" ||
              key === "keys" ||
              key === "values" ||
              key === "forEach"
              ? result
              : newMap;
          };
        }

        // Handle Set methods
        //@ts-ignore
        if (target instanceof Set && typeof target[key] === "function") {
          return function (...args: any[]) {
            const newSet = new Set(target);
            const result = (newSet[key as keyof Set<any>] as Function).apply(
              newSet,
              args
            );
            updateValue(newState, path ? path.split(".") : [], newSet);
            return key === "has" ||
              key === "entries" ||
              key === "keys" ||
              key === "values" ||
              key === "forEach"
              ? result
              : newSet;
          };
        }

        // Handle Date methods
        //@ts-ignore
        if (target instanceof Date && typeof target[key] === "function") {
          return function (...args: any[]) {
            const newDate = new Date(target.getTime()); // Use getTime() for exact copy
            const result = (newDate[key as keyof Date] as Function).apply(
              newDate,
              args
            );
            updateValue(newState, path ? path.split(".") : [], newDate);
            return key.startsWith("get") ? result : newDate;
          };
        }

        if (typeof value === "object" && value !== null) {
          return createStateProxy(
            Object.isFrozen(value)
              ? Array.isArray(value)
                ? [...value]
                : value instanceof Map
                ? new Map(value)
                : value instanceof Set
                ? new Set(value)
                : value instanceof Date
                ? new Date(value)
                : { ...value }
              : value,
            fullPath
          );
        } else {
          return value;
        }
      },
      set(_target, key: string, value) {
        const fullPath = path ? `${path}.${key}` : key;
        updateValue(newState, fullPath ? fullPath.split(".") : [key], value);
        return true;
      },
      deleteProperty(target, key: string) {
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
  } else if (currentState instanceof Map) {
    return new Map(currentState) as unknown as T;
  } else if (currentState instanceof Set) {
    return new Set(currentState) as unknown as T;
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

  // List of types you want to REJECT
  const invalidTags = new Set([
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
  let _parent: any = null;
  let _keyOrIndex: any = null;

  for (let i = 0; i < keys.length; i++) {
    const key: string | number = keys[i];
    const isLast = i === keys.length - 1;

    if (current instanceof Map) {
      if (isLast) {
        if (isDelete) {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      } else {
        let next = current.get(key);
        if (typeof next !== "object" || next === null) {
          next = {};
          current.set(key, next);
        } else if (next instanceof Map) {
          next = new Map(next);
          current.set(key, next);
        } else if (next instanceof Set) {
          next = new Set(next);
          current.set(key, next);
        } else if (Array.isArray(next)) {
          next = [...next];
          current.set(key, next);
        } else {
          next = { ...next };
          current.set(key, next);
        }
        _parent = current;
        _keyOrIndex = key;
        current = next;
      }
    } else if (current instanceof Set) {
      const arr = [...current];
      if (isLast) {
        if (isDelete) {
          arr.splice(Number(key), 1);
        } else {
          arr[Number(key)] = val;
        }
        current.clear();
        arr.forEach((item) => current.add(item));
      } else {
        let next = arr[Number(key)];
        if (typeof next !== "object" || next === null) {
          next = {};
        } else if (next instanceof Map) {
          next = new Map(next);
        } else if (next instanceof Set) {
          next = new Set(next);
        } else if (Array.isArray(next)) {
          next = [...next];
        } else {
          next = { ...next };
        }
        arr[Number(key)] = next;
        current.clear();
        arr.forEach((item) => current.add(item));
        _parent = current;
        _keyOrIndex = key;
        current = next;
      }
    } else if (Array.isArray(current)) {
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
        } else if (current[key as number] instanceof Map) {
          current[key as number] = new Map(current[key as number]);
        } else if (current[key as number] instanceof Set) {
          current[key as number] = new Set(current[key as number]);
        } else if (Array.isArray(current[key as number])) {
          current[key as number] = [...current[key as number]];
        } else {
          current[key as number] = { ...current[key as number] };
        }
        _parent = current;
        _keyOrIndex = key;
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
        } else if (current[key] instanceof Map) {
          current[key] = new Map(current[key]);
        } else if (current[key] instanceof Set) {
          current[key] = new Set(current[key]);
        } else if (Array.isArray(current[key])) {
          current[key] = [...current[key]];
        } else {
          current[key] = { ...current[key] };
        }
        _parent = current;
        _keyOrIndex = key;
        current = current[key];
      }
    } else {
      // Non-traversable type
      _parent = _parent;
      _keyOrIndex = _keyOrIndex;
      return;
    }
  }
}
