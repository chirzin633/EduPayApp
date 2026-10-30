import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import "../public/mazer/compiled/css/app.css";
import "../public/mazer/compiled/css/app-dark.css";
import "../public/mazer/compiled/css/iconly.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
