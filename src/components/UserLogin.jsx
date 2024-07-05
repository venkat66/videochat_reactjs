import React, { useState } from 'react';

const UserLogin = ({ onLogin }) => {
  const [userName, setUserName] = useState('');

  const handleLogin = () => {
    if (userName) {
      onLogin(userName);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Login</h5>
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-control"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name" 
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleLogin}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
