## similar to Immer but smaller and faster

Updating immutable state in react can be very hard, especially when dealing with deeply nested objects. immer-lite makes it easy — you can update state just like regular JavaScript objects. This keeps your code simple, clean, and easy to maintain. It works with objects, arrays, maps, sets, and more. This is not a state management library but a utility and can be used with other state management libraries like redux, zustand, x-plus and others. Goal of this library is to help the developer to spend less time on state management.

**`It'll handle immutability and destructuring for you so you don't have to`**

## Usage

### consider this is your state

```ts
import { i } from "immer-lite";

// consider this state
let state = {
  name: "John",
  age: 30,
  details: {
    address: {
      city: "New York",
      contact: {
        emails: ["john@example.com", "john@gmail.com"],
        phone: "+1234567890",
        social: new Map([
          ["facebook", "https://www.facebook.com/john"],
          ["twitter", "https://www.twitter.com/john"],
          ["instagram", "https://www.instagram.com/john"],
        ]),
      },
    },
  },
};
```

### without immer-lite : adding email

```ts
state = {
  ...state,
  details: {
    ...state.details,
    address: {
      ...state.details.address,
      contact: {
        ...state.details.address.contact,
        emails: [...state.details.address.contact.emails, "john@yahoo.com"],
      },
    },
  },
};
```

### with immer-lite : adding email

**`It'll destructure the parents objects internally.`**

```ts
state = i(state, (currentState) => {
  currentState.details.address.contact.emails.push("john@yahoo.com");
});
```

### without immer-lite : adding social media link

```ts
state = {
  ...state,
  details: {
    ...state.details,
    address: {
      ...state.details.address,
      contact: {
        ...state.details.address.contact,
        social: new Map([
          ...state.details.address.contact.social,
          ["linkedin", "https://www.linkedin.com/in/john"],
        ]),
      },
    },
  },
};
```

### with immer-lite : adding social media link

**`It'll destructure the parents objects internally.`**

```ts
state = i(state, (draft) => {
  draft.details.address.contact.social.set(
    "linkedin",
    "https://www.linkedin.com/in/john"
  );
});
```

### updating a 2D immutable array

```ts
const state = [
  [1, 2, 3],
  [4, 5, 6],
];

// using immer-lite
const newState = i(state, (s) => {
  s[0][0] = 10;
});

// without using immer-lite
const newState = state.map((row, rowIndex) => {
  return row.map((cell, cellIndex) => {
    if (rowIndex === 0 && cellIndex === 0) {
      return 10;
    }
    return cell;
  });
});
```

## using with Redux

```typescript
import { i } from "immer-lite";
function countReducer(state = initialState, action: ActionTypes) {
  switch (action.type) {
    case SET_STREET:
      return i(state, (s) => {
        s.address.street = "new street";
      });
    case DECR:
      return i(state, (s) => {
        s.count--;
      });
    case INCR:
      return i(state, (s) => s.count++);
    default:
      return state;
  }
}
```

## using with [x-plus](https://npmjs.com/package/x-plus)

x-plus is a state management library for react.

```ts
import { x } from "x-plus";
import { i } from "immer-lite";

const store = x({ address: { street: "old street" } });

store.update((state) => {
  state.address.street = "new street";
});
```

## API

**i(state, fn)** : returns the new state after applying the fn to the state

- arguments[0] : state : currently, maps, sets, objects, arrays are supported
- arguments[1] : fn(currentState, currentDraft): function that will be applied to the state

Draft function takes the current state and mutates it as needed while immer-lite takes care of the rest.

## Caveats

- immer-lite only supports objects, arrays, maps, sets.
- immer-lite does not support functions, symbols, and more.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or a pull request.

## Acknowledgements

- [immer](https://github.com/immerjs/immer) for the inspiration

## Author

Sean Freman
