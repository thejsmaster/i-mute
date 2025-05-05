export function i<T extends Object>(
  currentState: T,
  producer: (draft: T) => void
) {
  // only supports objects and arrays. no maps or sets. or any other kind.
  if (
    !isValidObject(currentState) ||
    currentState === null ||
    currentState === undefined
  ) {
    throw new Error("Only objects, arrays are supported at this moment");
  }
  const newState = shallowClone(currentState);
  producer(createStateProxy(newState));
  function createStateProxy<T extends Object>(obj: T, path = ""): T {
    return new Proxy(obj, {
      get(target, key: string) {
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
      set(target, key: string, value) {
        const fullPath = path ? `${path}.${key}` : key;

        updateValue(newState, fullPath, value);
        return true;
      },
      deleteProperty(target, key: string) {
        const fullPath = path ? `${path}.${key}` : key;
        updateValue(newState, fullPath, undefined, true);
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

export function updateValue(
  obj: any,
  path: string,
  val: any,
  isDelete: boolean = false
): void {
  if (typeof obj !== "object" || obj === null) {
    return;
  }
  let pathAccumulated = "";
  const keys = path.split(".");
  let currentObj = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    pathAccumulated =
      pathAccumulated.length > 0 ? pathAccumulated + "." + key : key;
    if (!alreadyDestructuredPaths.includes(pathAccumulated)) {
      if (
        currentObj.hasOwnProperty(key) &&
        typeof currentObj[key] === "object"
      ) {
        if (Array.isArray(currentObj[key])) {
          currentObj[key] = [...currentObj[key]];
        } else {
          currentObj[key] = { ...currentObj[key] };
        }
        alreadyDestructuredPaths.push(pathAccumulated);
        currentObj = currentObj[key];
      } else {
        // If the key doesn't exist or is not an object, create an empty object
        currentObj[key] = {};
        currentObj = currentObj[key];
      }
    } else {
      currentObj = currentObj[key];
    }
  }

  //@ts-ignore
  if (isDelete) {
    delete currentObj[keys[keys.length - 1]];
  } else {
    currentObj[keys[keys.length - 1]] = val;
  }
}

export function isValidObject(value: any) {
  if (value === undefined || value === null) return true;

  if (typeof value !== "object") return false;

  const tag = Object.prototype.toString.call(value);

  // List of types you want to REJECT
  const invalidTags = new Set([
    "[object Date]",
    "[object Promise]",
    "[object RegExp]",
    "[object Map]",
    "[object Set]",
    "[object WeakMap]",
    "[object WeakSet]",
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
