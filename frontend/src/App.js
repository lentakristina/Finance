import React from "react";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import ProgressGoals from "./components/ProgressGoals";
import Login from "./components/Login";
import Register from "./components/Register";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";



function App() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navbar tidak muncul di halaman login dan register
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = () => {
  logout(); // hapus user/token
  toast.success("You have logged out successfully 🚪✨", {
    autoClose: 3000, // 3 detik
  });

  setTimeout(() => {
    navigate("/login");
  }, 3000); // delay 3 detik sebelum redirect
};


  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

 return (
      <div className="app">
        {/* Navbar */}
        {!hideNavbar && user && (
        <nav className="navbar-glass">
          <div className="navbar-left">
            <h3 className="brand">
              💸 FinTrack | <span className="username">{user?.name || user?.email?.split("@")[0]}</span>
            </h3>
          </div>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/transactions">Transactions</NavLink>
            </li>
            <li>
              <NavLink to="/goals">Goals</NavLink>
            </li>
          </ul>
          <div className="navbar-right">
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>


          </div>
        </nav>
        )}
      <div className="content">
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={<Register />}
          />
          <Route
            path="/"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/transactions"
            element={user ? <Transactions /> : <Navigate to="/login" />}
          />
          <Route
            path="/goals"
            element={user ? <ProgressGoals /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;
