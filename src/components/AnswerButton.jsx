import React from 'react';

const AnswerButton = ({ onAnswer }) => {
  return (
    <div className="container mt-3">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <button 
            className="btn btn-success btn-block"
            onClick={onAnswer}
          >
            Answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnswerButton;
