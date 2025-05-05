"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alreadyDestructuredPaths = void 0;
exports.i = i;
exports.shallowClone = shallowClone;
exports.isValidObject = isValidObject;
exports.updateValue = updateValue;
// i behaves like immer. can you make it support map and set?
function i(currentState, producer) {
    // now supports objects, arrays, maps and sets
    if (!isValidObject(currentState) ||
        currentState === null ||
        currentState === undefined) {
        throw new Error("Only objects, arrays, maps and sets are supported");
    }
    var newState = shallowClone(currentState);
    var draft = createStateProxy(newState, "");
    producer(draft);
    function createStateProxy(obj, path) {
        if (path === void 0) { path = ""; }
        //@ts-ignore
        return new Proxy(obj, {
            get: function (target, key) {
                var fullPath = path ? "".concat(path, ".").concat(key) : key;
                //@ts-ignore
                var value = target[key];
                // Handle Map methods
                //@ts-ignore
                if (target instanceof Map && typeof target[key] === "function") {
                    return function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        var newMap = new Map(target);
                        var result = newMap[key].apply(newMap, args);
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
                    return function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        var newSet = new Set(target);
                        var result = newSet[key].apply(newSet, args);
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
                    return function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        var newDate = new Date(target.getTime()); // Use getTime() for exact copy
                        var result = newDate[key].apply(newDate, args);
                        updateValue(newState, path ? path.split(".") : [], newDate);
                        return key.startsWith("get") ? result : newDate;
                    };
                }
                if (typeof value === "object" && value !== null) {
                    return createStateProxy(Object.isFrozen(value)
                        ? Array.isArray(value)
                            ? __spreadArray([], __read(value), false) : value instanceof Map
                            ? new Map(value)
                            : value instanceof Set
                                ? new Set(value)
                                : value instanceof Date
                                    ? new Date(value)
                                    : __assign({}, value)
                        : value, fullPath);
                }
                else {
                    return value;
                }
            },
            set: function (_target, key, value) {
                var fullPath = path ? "".concat(path, ".").concat(key) : key;
                updateValue(newState, fullPath ? fullPath.split(".") : [key], value);
                return true;
            },
            deleteProperty: function (target, key) {
                var fullPath = path ? "".concat(path, ".").concat(key) : key;
                updateValue(newState, fullPath ? fullPath.split(".") : [key], null, true);
                //@ts-ignore
                delete target[key];
                return true;
            },
        });
    }
    exports.alreadyDestructuredPaths = [];
    return newState;
}
function shallowClone(currentState) {
    if (Array.isArray(currentState)) {
        return __spreadArray([], __read(currentState), false);
    }
    else if (currentState instanceof Map) {
        return new Map(currentState);
    }
    else if (currentState instanceof Set) {
        return new Set(currentState);
    }
    else if (typeof currentState === "object" && currentState !== null) {
        return __assign({}, currentState);
    }
    return currentState;
}
exports.alreadyDestructuredPaths = [];
function isValidObject(value) {
    if (value === undefined || value === null)
        return true;
    if (typeof value !== "object")
        return false;
    var tag = Object.prototype.toString.call(value);
    // List of types you want to REJECT
    var invalidTags = new Set([
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
function updateValue(obj, path, val, isDelete) {
    if (isDelete === void 0) { isDelete = false; }
    if (typeof obj !== "object" || obj === null)
        return;
    // Convert path to array if it's not already
    var keys = Array.isArray(path)
        ? path
        : typeof path === "string"
            ? path.split(".")
            : [path];
    var current = obj;
    var _parent = null;
    var _keyOrIndex = null;
    for (var i_1 = 0; i_1 < keys.length; i_1++) {
        var key = keys[i_1];
        var isLast = i_1 === keys.length - 1;
        if (current instanceof Map) {
            if (isLast) {
                if (isDelete) {
                    current.delete(key);
                }
                else {
                    current.set(key, val);
                }
            }
            else {
                var next = current.get(key);
                if (typeof next !== "object" || next === null) {
                    next = {};
                    current.set(key, next);
                }
                else if (next instanceof Map) {
                    next = new Map(next);
                    current.set(key, next);
                }
                else if (next instanceof Set) {
                    next = new Set(next);
                    current.set(key, next);
                }
                else if (Array.isArray(next)) {
                    next = __spreadArray([], __read(next), false);
                    current.set(key, next);
                }
                else {
                    next = __assign({}, next);
                    current.set(key, next);
                }
                _parent = current;
                _keyOrIndex = key;
                current = next;
            }
        }
        else if (current instanceof Set) {
            var arr = __spreadArray([], __read(current), false);
            if (isLast) {
                if (isDelete) {
                    arr.splice(Number(key), 1);
                }
                else {
                    arr[Number(key)] = val;
                }
                current.clear();
                arr.forEach(function (item) { return current.add(item); });
            }
            else {
                var next = arr[Number(key)];
                if (typeof next !== "object" || next === null) {
                    next = {};
                }
                else if (next instanceof Map) {
                    next = new Map(next);
                }
                else if (next instanceof Set) {
                    next = new Set(next);
                }
                else if (Array.isArray(next)) {
                    next = __spreadArray([], __read(next), false);
                }
                else {
                    next = __assign({}, next);
                }
                arr[Number(key)] = next;
                current.clear();
                arr.forEach(function (item) { return current.add(item); });
                _parent = current;
                _keyOrIndex = key;
                current = next;
            }
        }
        else if (Array.isArray(current)) {
            // Use numeric key only for arrays
            var numKey = typeof key === "string" ? Number(key) : key;
            if (isLast) {
                if (isDelete) {
                    current.splice(numKey, 1);
                }
                else {
                    current[numKey] = val;
                }
            }
            else {
                if (typeof current[key] !== "object" ||
                    current[key] === null) {
                    current[key] = {};
                }
                else if (current[key] instanceof Map) {
                    current[key] = new Map(current[key]);
                }
                else if (current[key] instanceof Set) {
                    current[key] = new Set(current[key]);
                }
                else if (Array.isArray(current[key])) {
                    current[key] = __spreadArray([], __read(current[key]), false);
                }
                else {
                    current[key] = __assign({}, current[key]);
                }
                _parent = current;
                _keyOrIndex = key;
                current = current[key];
            }
        }
        else if (typeof current === "object") {
            // Use key directly without conversion for objects
            if (isLast) {
                if (isDelete) {
                    delete current[key];
                }
                else {
                    current[key] = val;
                }
            }
            else {
                if (typeof current[key] !== "object" || current[key] === null) {
                    current[key] = {};
                }
                else if (current[key] instanceof Map) {
                    current[key] = new Map(current[key]);
                }
                else if (current[key] instanceof Set) {
                    current[key] = new Set(current[key]);
                }
                else if (Array.isArray(current[key])) {
                    current[key] = __spreadArray([], __read(current[key]), false);
                }
                else {
                    current[key] = __assign({}, current[key]);
                }
                _parent = current;
                _keyOrIndex = key;
                current = current[key];
            }
        }
        else {
            // Non-traversable type
            _parent = _parent;
            _keyOrIndex = _keyOrIndex;
            return;
        }
    }
}
