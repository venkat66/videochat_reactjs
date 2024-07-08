import  { useState, useRef, useEffect } from 'react';
// import UserLogin from '../components/UserLogin';
// import CallInput from '../components/CallInput';
import UserInfo from '../../components/UserInfo';
import AnswerButton from '../../components/AnswerButton';
import CallingStatus from '../../components/CallingStatus';
import InCallStatus from '../../components/InCallStatus';
import Videos from '../../components/Videos';
import { HOST } from '../../api/api';
import Logout from '../../components/Logout';

const VideoCall = () => {
  const [myName, setMyName] = useState('');
  const [otherUser, setOtherUser] = useState('');
  const [remoteRTCMessage, setRemoteRTCMessage] = useState(null);
  const [iceCandidatesFromCaller, setIceCandidatesFromCaller] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [showUserNameInput, setShowUserNameInput] = useState(!myName);
  const [showCallInput, setShowCallInput] = useState(!!myName);
  const [showUserInfo, setShowUserInfo] = useState(!!myName);
  const [showAnswerButton, setShowAnswerButton] = useState(false);
  const [showCalling, setShowCalling] = useState(false);
  const [showInCall, setShowInCall] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [callInProgress, setCallInProgress] = useState(false);

  const callSocketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const pcConfig = {
    iceServers: [
      { url: 'stun:stun.jap.bloggernepal.com:5349' },
      {
        url: 'turn:turn.jap.bloggernepal.com:5349',
        username: 'guest',
        credential: 'somepassword'
      },
      { url: 'stun:stun.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (callSocketRef.current) {
      callSocketRef.current.onmessage = (e) => {
        const response = JSON.parse(e.data);
        const type = response.type;

        if (type === 'connection') {
          console.log('Connection:', response.data);
        }

        if (type === 'call_received') {
          console.log('Call received:', response.data);
          onNewCall(response.data);
        }

        if (type === 'call_answered') {
          console.log('Call answered:', response.data);
          onCallAnswered(response.data);
        }

        if (type === 'ICEcandidate') {
          console.log('ICEcandidate:', response.data);
          receiveICEcandidate(response.data);
        }
      };
    }
  },);

  const connectSocket = (myName) => {
    callSocketRef.current = new WebSocket(HOST + '/ws/call/');

    callSocketRef.current.onopen = () => {
      console.log('WebSocket connection opened for user:', myName);
      callSocketRef.current.send(
        JSON.stringify({
          type: 'login',
          data: {
            name: myName
          }
        })
      );
    };
  };

  const login = (e) => {
    console.log('Logging in as:', myName);
    setMyName(myName);
    setShowUserNameInput(false);
    setShowCallInput(true);
    setShowUserInfo(true);
    connectSocket(myName);
  };

  const call = () => {
    beReady().then((bool) => {
      processCall(otherUser);
    });
  };

  const answer = () => {
    beReady().then((bool) => {
      processAccept();
    });
    setShowAnswerButton(false);
  };

  const onNewCall = (data) => {
    console.log("onNewCall:",data)
    setOtherUser(data.caller);
    setShowAnswerButton(true);
    setRemoteRTCMessage(data.rtcMessage);
    setIceCandidatesFromCaller(data.iceCandidates);
  };

  const onCallAnswered = (data) => {
    setRemoteRTCMessage(data.rtcMessage);
    peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(data.rtcMessage)
    );

    if (data.iceCandidates) {
      data.iceCandidates.forEach((candidate) => {
        try {
          peerConnectionRef.current.addIceCandidate(candidate);
        } catch (error) {
          console.log('Error adding received ICE candidate:', error);
        }
      });
    }
    callProgress();
  };

  const beReady = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      console.log('Local stream obtained');
      setLocalStream(stream);
      return await createConnectionAndAddStream(stream);
    } catch (e) {
      alert('getUserMedia() error: ' + e.name);
    }
  };

  const createConnectionAndAddStream = (stream) => {
    createPeerConnection();
    peerConnectionRef.current.addStream(stream);
    return true;
  };

  const processCall = (userName) => {
    peerConnectionRef.current.createOffer(
      (sessionDescription) => {
        peerConnectionRef.current.setLocalDescription(sessionDescription);
        sendCall({
          name: userName,
          rtcMessage: sessionDescription
        });
      },
      (error) => {
        console.log('Error creating offer:', error);
      }
    );
  };

  const processAccept = () => {
    peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage)
    );
    peerConnectionRef.current.createAnswer(
      (sessionDescription) => {
        peerConnectionRef.current.setLocalDescription(sessionDescription);

        if (iceCandidatesFromCaller.length > 0) {
          iceCandidatesFromCaller.forEach((candidate) => {
            try {
              peerConnectionRef.current.addIceCandidate(candidate);
            } catch (error) {
              console.log('Error adding ICE candidate:', error);
            }
          });
          setIceCandidatesFromCaller([]);
        }

        answerCall({
          caller: otherUser,
          rtcMessage: sessionDescription
        });
      },
      (error) => {
        console.log('Error creating answer:', error);
      }
    );
  };

  const createPeerConnection = () => {
    try {
      peerConnectionRef.current = new RTCPeerConnection(pcConfig);
      peerConnectionRef.current.onicecandidate = handleIceCandidate;
      peerConnectionRef.current.onaddstream = handleRemoteStreamAdded;
      peerConnectionRef.current.onremovestream = handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnection');
    } catch (e) {
      console.log('Failed to create PeerConnection:', e.message);
      alert('Cannot create RTCPeerConnection object.');
    }
  };

  const handleIceCandidate = (event) => {
    if (event.candidate) {
      sendICEcandidate({
        user: otherUser,
        rtcMessage: {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        }
      });
    } else {
      console.log('End of ICE candidates.');
    }
  };

  const handleRemoteStreamAdded = (event) => {
    console.log('Remote stream added');
    setRemoteStream(event.stream);
  };

  const handleRemoteStreamRemoved = () => {
    setRemoteStream(null);
    setLocalStream(null);
  };

  const sendCall = (data) => {
    callSocketRef.current.send(
      JSON.stringify({
        type: 'call',
        data
      })
    );
    setShowCallInput(false);
    setShowCalling(true);
  };

  const answerCall = (data) => {
    callSocketRef.current.send(
      JSON.stringify({
        type: 'answer_call',
        data
      })
    );
    callProgress();
  };

  const sendICEcandidate = (data) => {
    if (callSocketRef.current.readyState === WebSocket.OPEN) {
      callSocketRef.current.send(
        JSON.stringify({
          type: 'ICEcandidate',
          data
        })
      );
    } else {
      console.error('WebSocket is not open. Ready state:', callSocketRef.current.readyState);
    }
  };

  const receiveICEcandidate = (data) => {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: data.rtcMessage.label,
      candidate: data.rtcMessage.candidate,
      sdpMid: data.rtcMessage.id
    });
    try {
      peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.log('Error adding received ICE candidate:', error);
    }
  };

  const callProgress = () => {
    setShowCalling(false);
    setShowInCall(true);
    setShowVideos(true);
    setCallInProgress(true);
  };

  const stop = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setCallInProgress(false);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setShowCallInput(true);
    setShowAnswerButton(false);
    setShowInCall(false);
    setShowCalling(false);
    setOtherUser('');
  };

  return (
    <div className="container">
      {showUserNameInput && 
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
                      value={myName}
                      onChange={(e) => setMyName(e.target.value)}
                      placeholder="Enter your name" 
                    />
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={login}
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      {showCallInput && 
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
                      value={otherUser}
                      onChange={(e) => setOtherUser(e.target.value)}
                      placeholder="Call username" 
                    />
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={call}
                  >
                    Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      {showUserInfo && <UserInfo userName={myName} />}
      {<Logout />}
      {showAnswerButton && <AnswerButton onAnswer={answer} />}
      {showCalling && <CallingStatus otherUser={otherUser} />}
      {showInCall && <InCallStatus otherUser={otherUser} onStop={stop} />}
      {showVideos && <Videos localStream={localStream} remoteStream={remoteStream} />}
    </div>
  );
};

export default VideoCall;
