import React from 'react';

const UserInfo = ({ userName }) => {
  return (
    <div className="container mt-3">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">User Information</h5>
              <p className="card-text">Logged in as: {userName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
