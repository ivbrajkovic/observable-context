# 🌟 Observable-Context 🌟

![Banner Image](./assets/banner.png)

> **Reactive Contexts in React, Made Effortless!** Supercharge your React context with built-in reactivity using `observable-context`.

[![Build Status](https://travis-ci.com/yourusername/observable-context.svg?branch=master)](https://travis-ci.com/yourusername/observable-context)
[![npm version](https://badge.fury.io/js/observable-context.svg)](https://badge.fury.io/js/observable-context)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Features

- 🎣 **Hooks Ready**: Custom hooks tailored for your context.
- 📦 **Zero Boilerplate**: Set up reactive contexts without the repetitive code.
- 🚀 **Efficient Renders**: Components re-render only when the observed properties change.
- 🔌 **Plug & Play**: Integrates seamlessly with any React project.
- ⚙️ **Fully Typed**: javascript support out-of-the-box.

---

## 🔄 Batching Updates

One of the standout features of `observable-context` is its ability to batch updates. Instead of triggering a re-render for each individual state change, you can batch multiple updates together and apply them all at once. This not only reduces the number of renders but also ensures a smoother user experience, especially when dealing with rapid state changes.

### How to Use:

Batching updates is as simple as wrapping your update logic within `beginBatchUpdate` and `endBatchUpdate` calls.

```javascript
const { beginBatchUpdate, endBatchUpdate, proxy } = useYourContext();

beginBatchUpdate();
proxy.key1 = "new value 1";
proxy.key2 = "new value 2";
// ... other updates
endBatchUpdate();
```

Between the `beginBatchUpdate` and `endBatchUpdate` calls, all changes to the context are accumulated. Once `endBatchUpdate` is called, all accumulated changes are applied simultaneously, triggering a single re-render.

---

## 📚 Getting Started

### Installation

Using npm:

```bash
npm install @ivbrajkovic/observable-context --save
```

Or using yarn:

```bash
yarn add @ivbrajkovic/observable-context
```

### Basic Usage with React

**Setting up the Observable Context**:

```javascript
import React from "react";
import { observableContextFactory } from "@ivbrajkovic/observable-context";

export const user = {
  name: "John",
  age: 30,
  email: "john.doe@example.com",
};

// Create an observable user context
export const {
  ContextProvider: UserProvider,
  useObservableContext,
  useWatch,
  useWatchList,
  useWatchAll,
} = observableContextFactory<typeof User>();
```

**Using the Provider**:

```javascript
function App() {
  return (
    // Initial prop can be function that return initial state
    <UserProvider initial={user}>
      <UpdateName />
      <UpdateUserDetails />
      <UpdateCompleteUser />
    </UserProvider>
  );
}

export default App;
```

**Using the Hooks**:

```javascript
function UpdateName() {
  const { state, setState } = useWatch("name");

  return (
    <div>
      <h1>Hello, {name}!</h1>
      <button onClick={() => setName("Jane")}>Change Name to Jane</button>
    </div>
  );
}
```

```javascript
function UpdateUserDetails() {
  const { state, setState } = useWatchList(["name", "email"]);

  return (
    <div>
      <h1>{state.name}</h1>
      <p>Email: {state.email}</p>
      <button
        onClick={() => setState({ name: "Doe", email: "doe@example.com" })}
      >
        Update Details
      </button>
    </div>
  );
}
```

```javascript
function UpdateCompleteUser() {
  const { state, setState } = useSubscribeAll();

  return (
    <div>
      <h1>{state.name}</h1>
      <p>Age: {state.age}</p>
      <p>Email: {state.email}</p>
      <button
        onClick={() =>
          setValues({ name: "Alice", age: 25, email: "alice@example.com" })
        }
      >
        Update All Details
      </button>
    </div>
  );
}
```

---

## 📖 Documentation

For in-depth documentation, guides, and API details, check [here](https://ivbrajkovic.github.io/observable-context/docs).

---

## 🤝 Contributing

Enhancements and improvements are welcome! See our [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

---

## 📃 License

`Observable-Context` is [MIT licensed](./LICENSE).

---

## 💌 Contact & Support

For feedback, questions, or support, get in touch:

- [Twitter](https://twitter.com/yourusername)
- [Email](mailto:youremail@example.com)
