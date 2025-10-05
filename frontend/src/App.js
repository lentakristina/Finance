import React from "react";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import ProgressGoals from "./components/ProgressGoals";
import Login from "./components/Login";
import Register from "./components/Register";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = () => {
    logout();
    toast.success("You have logged out successfully", {
      duration: 3000,
    });
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* React Hot Toast - Simple & Reliable */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 2000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {!hideNavbar && user && (
        <nav className="navbar-glass">
          <div className="navbar-left">
            <h3 className="brand">
              FinTrack | <span className="username">{user?.name || user?.email?.split("@")[0]}</span>
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
          <NavLink 
            to="#" 
            onClick={handleLogout} 
            className="nav-link logout-link">
            Logout
          </NavLink>
        </nav>
      )}

      <div className="content">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={user ? <Transactions /> : <Navigate to="/login" />} />
          <Route path="/goals" element={user ? <ProgressGoals /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;