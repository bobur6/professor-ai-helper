import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ModeToggle from './ModeToggle';

function Navbar({ mode, onModeChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  
  // Show mode toggle only on dashboard
  const showModeToggle = location.pathname === '/dashboard';

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              Professor AI Helper
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {token ? (
              <>
                <div className="flex items-center space-x-4">
                  {showModeToggle && mode && onModeChange && (
                    <ModeToggle mode={mode} onChange={onModeChange} />
                  )}
                  <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600">
                    Дашборд
                  </Link>
                  <Link to="/classes" className="text-gray-700 hover:text-indigo-600">
                    Мои классы
                  </Link>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-indigo-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
