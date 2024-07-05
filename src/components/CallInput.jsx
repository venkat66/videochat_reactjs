import React, { useState } from 'react';

const CallInput = ({ onCall }) => {
  const [callName, setCallName] = useState('');

  const handleCall = () => {
    if (callName) {
      onCall(callName);
    }
  };

  return (
    <div className="container mt-3">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Make a Call</h5>
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-control"
                  value={callName}
                  onChange={(e) => setCallName(e.target.value)}
                  placeholder="Call username" 
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleCall}
              >
                Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallInput;
