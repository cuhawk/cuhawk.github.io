# ReactJS

ReactJS is a popular JavaScript library for building user interfaces, particularly single-page applications. It allows developers to create reusable UI components. Below is a comprehensive list of the components and concepts associated with ReactJS:

### Core Concepts

1. **JSX (JavaScript XML)**:
2. Syntax extension that allows writing HTML elements in JavaScript.
3. Example: `<h1>Hello, world!</h1>`.
4. **Components**:
5. The building blocks of a React application.
6. Two types: Functional Components and Class Components.

### Functional Components

- Defined as JavaScript functions.
- Return JSX to render the UI.
- Example:

  ```
  function Welcome(props) {
    return <h1>Hello, {props.name}</h1>;
  }
  ```

### Class Components

- ES6 classes that extend `React.Component`.
- Must contain a `render()` method.
- Example:

  ```
  class Welcome extends React.Component {
    render() {
      return <h1>Hello, {this.props.name}</h1>;
    }
  }
  ```

### Component Lifecycle Methods (for Class Components)

1. **Mounting**:
2. `constructor()`
3. `static getDerivedStateFromProps()`
4. `render()`
5. `componentDidMount()`
6. **Updating**:
7. `static getDerivedStateFromProps()`
8. `shouldComponentUpdate()`
9. `render()`
10. `getSnapshotBeforeUpdate()`
11. `componentDidUpdate()`
12. **Unmounting**:
13. `componentWillUnmount()`

### State and Props

- **State**: Local state within a component. Managed using `useState` hook (in functional components) or state property in class components.

  ```
  const [count, setCount] = useState(0);
  ```
- **Props**: Read-only attributes passed from parent to child components.

  ```
  <Welcome name="Sara" />
  ```

### Hooks (for Functional Components)

1. **useState**: Manages state.
2. **useEffect**: Handles side effects.
3. **useContext**: Accesses context values.
4. **useReducer**: Manages complex state logic.
5. **useCallback**: Memoizes callback functions.
6. **useMemo**: Memoizes expensive calculations.
7. **useRef**: Accesses DOM elements directly.
8. **useLayoutEffect**: Similar to `useEffect` but fires synchronously after all DOM mutations.
9. **useImperativeHandle**: Customizes the instance value that is exposed when using `ref`.
10. **useDebugValue**: Displays a label for custom hooks in React DevTools.

### Context API

- Provides a way to pass data through the component tree without passing props down manually at every level.

  ```
  const MyContext = React.createContext(defaultValue);
  ```

### Higher-Order Components (HOC)

- A pattern that involves a function that takes a component and returns a new component.

  ```
  function withLoading(Component) {
    return function LoadingComponent(props) {
      return <Component {...props} />;
    }
  }
  ```

### Render Props

- A technique for sharing code between React components using a prop whose value is a function.

  ```
  <DataProvider render={(data) => <SomeComponent data={data} />} />
  ```

### Fragments

- Allows grouping multiple elements without adding extra nodes to the DOM.

  ```
  <React.Fragment>
    <ChildA />
    <ChildB />
  </React.Fragment>
  ```

### Portals

- Provides a way to render children into a DOM node that exists outside the DOM hierarchy of the parent component.

  ```
  ReactDOM.createPortal(child, container);
  ```

### Error Boundaries

- Catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI.

  ```
  class ErrorBoundary extends React.Component {
    componentDidCatch(error, info) {
      // Handle error
    }
    render() {
      return this.props.children;
    }
  }
  ```

### Refs

- Provides a way to access the DOM nodes or React elements created in the render method.

  ```
  const myRef = React.createRef();
  ```

### PropTypes

- Runtime type checking for props in React components.

  ```
  MyComponent.propTypes = {
    name: PropTypes.string.isRequired,
  };
  ```

### Custom Hooks

- Functions that start with "use" and can call other hooks.

  ```
  function useCustomHook() {
    const [state, setState] = useState(initialState);
    return [state, setState];
  }
  ```

### Concurrent Mode (Experimental)

- Allows React to work on multiple tasks simultaneously.

### Suspense and Lazy

- `Suspense`: Enables waiting for some code to load and declaratively specify a loading state.
- `React.lazy()`: Dynamically imports a component.

  ```
  const OtherComponent = React.lazy(() => import('./OtherComponent'));
  ```

Understanding these components and concepts is crucial for effectively building and maintaining React applications.
