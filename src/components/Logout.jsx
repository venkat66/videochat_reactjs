import React from 'react';

const Logout = ({ onLogout }) => {
  const handleLogout = () => {
    localStorage.removeItem('myName');
    window.location.reload();
  };

  return (
    <button className="btn btn-danger" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;
