import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // 🔹 ini ambil App dari App.js
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={5000}  // 5 detik
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="colored"
    />
  </>
);
