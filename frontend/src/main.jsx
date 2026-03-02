import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthContextProvider } from "./context/authContext";
import { TransactionContextProvider } from "./context/transactionContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthContextProvider>
      <TransactionContextProvider>
        <App />
      </TransactionContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
