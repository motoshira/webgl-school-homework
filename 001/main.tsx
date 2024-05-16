import { h, render } from "preact";
import "./index.css";

const App = () => (
  <div>
    <h1>Hello, World!</h1>
  </div>
);

render(<App />, document.getElementById("#app")!);
