import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link">
            📅 Leave Management
          </Link>
        </div>

        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/apply-leave" className="nav-link">
                Apply Leave
              </Link>
              <Link to="/leaves" className="nav-link">
                My Leaves
              </Link>

              <div className="navbar-user">
                <span className="user-info">
                  Welcome, {user.name}
                  {user.role === 'admin' && (
                    <span className="admin-badge">Admin</span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-logout"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
