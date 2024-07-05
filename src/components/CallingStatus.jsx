import React from 'react';

const CallingStatus = ({ otherUser }) => {
  return (
    <div className="container mt-3">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="alert alert-info">
            Calling {otherUser}...
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallingStatus;
