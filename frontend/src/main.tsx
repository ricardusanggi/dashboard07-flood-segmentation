// frontend/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./main.css";

import { TrainingLockProvider } from "./components/context/TrainingLockContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TrainingLockProvider>
        <App />
      </TrainingLockProvider>
    </BrowserRouter>
  </React.StrictMode>
);
