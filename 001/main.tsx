import { h, render } from "preact";
import "./index.css";

const App = () => (
  <div>
    <h1>WebGL School 2024 Homework 001</h1>
    <p>Let's get started!</p>
  </div>
);

render(<App />, document.getElementById("#app")!);
