import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <NavLink to="/dashboard" className="brand-link">
            <span className="brand-icon">🗓️</span>
            <span>LeaveFlow</span>
          </NavLink>
        </div>

        <div className="navbar-menu">
          {user ? (
            <>
              <div className="nav-links">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/apply-leave"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Apply Leave
                </NavLink>
                <NavLink
                  to="/leaves"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  My Leaves
                </NavLink>
              </div>

              <div className="navbar-user">
                <span className="user-avatar">{getInitial(user.name)}</span>
                <div className="user-meta">
                  <span className="user-name">{user.name}</span>
                  {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                </div>
                <button onClick={handleLogout} className="btn-ghost">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-auth">
              <NavLink to="/login" className="nav-link">
                Login
              </NavLink>
              <NavLink to="/register" className="nav-link">
                Register
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
