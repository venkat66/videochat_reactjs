import React from 'react';

const InCallStatus = ({ otherUser, onStop }) => {
  return (
    // <div>
    //   <button onClick={onStop}>End Call</button>
    //   <p>In Call with <span>{otherUser}</span></p>
    // </div>
    <div className="container mt-3">
    <div className="row justify-content-center">
      <div className="col-md-6">
        <button 
          className="btn btn-success btn-block"
          onClick={onStop}
        >
          End Call
        </button>
        <p>In Call with <span>{otherUser}</span></p>
      </div>
    </div>
  </div>
  );
};

export default InCallStatus;
