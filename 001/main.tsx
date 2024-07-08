import { h, render, Fragment } from "preact";
import "./index.css";
import ThreeAppContent from "./ThreeApp";

const App = () => (
  <Fragment>
    <div class="back-to-home-container">
      <a class="back-to-home-link" href="../">
        {"← Back to Home"}
      </a>
    </div>
    <ThreeAppContent />
  </Fragment>
);

render(<App />, document.getElementById("#app")!);
