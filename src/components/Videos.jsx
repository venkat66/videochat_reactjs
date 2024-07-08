const handleRemoteStreamAdded = (event) => {
  console.log('Remote stream added:', event.stream);
  setRemoteStream(event.stream);
};

// In your Videos component, add logging to check the streams
import React, { useEffect, useRef } from 'react';

const Videos = ({ localStream, remoteStream }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) {
      console.log('Setting local stream:', localStream);
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      console.log('Setting remote stream:', remoteStream);
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
                ref={localVideoRef} 
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
                ref={remoteVideoRef} 
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
