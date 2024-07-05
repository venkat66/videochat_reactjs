import React from 'react';

const Videos = ({ localStream, remoteStream }) => {
  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Local Video</h5>
              <video 
                id="localVideo" 
                autoPlay 
                muted 
                ref={video => {
                  if (video) {
                    video.srcObject = localStream;
                  }
                }} 
                className="w-100"
              ></video>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Remote Video</h5>
              <video 
                id="remoteVideo" 
                autoPlay 
                ref={video => {
                  if (video) {
                    video.srcObject = remoteStream;
                  }
                }} 
                className="w-100"
              ></video>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Videos;
