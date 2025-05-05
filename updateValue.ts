export function updateValue(
  obj: any,
  path: string | number,
  val: any,
  isDelete: boolean = false
): void {
  if (typeof obj !== "object" || obj === null) return;

  const keys = typeof path === "string" ? path.split(".") : [path];
  let current = obj;
  let parent: any = null;
  let keyOrIndex: any = null;

  for (let i = 0; i < keys.length; i++) {
    const key = isNaN(Number(keys[i])) ? keys[i] : Number(keys[i]);
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
        parent = current;
        keyOrIndex = key;
        current = next;
      }
    } else if (current instanceof Set) {
      const arr = [...current];
      if (isLast) {
        if (isDelete) {
          arr.splice(key, 1);
        } else {
          arr[key] = val;
        }
        current.clear();
        arr.forEach((item) => current.add(item));
      } else {
        let next = arr[key];
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
        arr[key] = next;
        current.clear();
        arr.forEach((item) => current.add(item));
        parent = current;
        keyOrIndex = key;
        current = next;
      }
    } else if (Array.isArray(current)) {
      if (isLast) {
        if (isDelete) {
          current.splice(key, 1);
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
        parent = current;
        keyOrIndex = key;
        current = current[key];
      }
    } else if (typeof current === "object") {
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
        parent = current;
        keyOrIndex = key;
        current = current[key];
      }
    } else {
      // Non-traversable type
      return;
    }
  }
}
