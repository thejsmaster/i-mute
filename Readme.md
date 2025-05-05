## similar to Immer but smaller and faster

It's hard to work with immutable states in javascript especially when you're dealing with complex nested objects.

immer-lite helps you to set the immutable state as you would with a normal object saving you a lot of time and energy. It makes the code very clean and readable and maintanable.

it suppports objects, arrays, maps, sets, and more.

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

**`It'll destructur internally so you don't have to`**

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

**`It'll destructur internally so you don't have to`**

```ts
state = i(state, (draft) => {
  draft.details.address.contact.social.set(
    "linkedin",
    "https://www.linkedin.com/in/john"
  );
});
```

### without immer-lite : updating social media link

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

### with immer-lite : updating social media link

**`It'll destructur internally so you don't have to`**

```ts
state = i(state, (draft) => {
  draft.details.address.contact.social.set(
    "linkedin",
    "https://www.linkedin.com/in/john"
  );
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
