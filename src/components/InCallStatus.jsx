import React from 'react';

const InCallStatus = ({ otherUser, onStop }) => {
  return (
    <div>
      <button onClick={onStop}>End Call</button>
      <p>In Call with <span>{otherUser}</span></p>
    </div>
  );
};

export default InCallStatus;
