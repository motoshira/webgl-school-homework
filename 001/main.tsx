import { h, render, Fragment } from "preact";
import "./index.css";
import ThreeAppContent from "./ThreeApp";

const App = () => (
  <>
    <div class="back-to-home-container">
      <a class="back-to-home-link" href="../">
        {"← Back to Home"}
      </a>
    </div>
    <ThreeAppContent />
  </>
);

render(<App />, document.getElementById("#app")!);
