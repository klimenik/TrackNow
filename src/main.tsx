import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { applyTheme, getTheme } from "./lib/theme";
import { requestPersistence } from "./lib/storage";

applyTheme(getTheme());

// Ask the browser to keep our local data around (reduces iOS/Safari eviction).
void requestPersistence();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
