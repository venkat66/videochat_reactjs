import React, { useState, useRef, useEffect } from 'react';
import UserLogin from '../components/UserLogin';
import CallInput from '../components/CallInput';
import UserInfo from '../components/UserInfo';
import AnswerButton from '../components/AnswerButton';
import CallingStatus from '../components/CallingStatus';
import InCallStatus from '../components/InCallStatus';
import Videos from '../components/Videos';

const VideoCall = () => {
  const [myName, setMyName] = useState('');
  const [otherUser, setOtherUser] = useState('');
  const [remoteRTCMessage, setRemoteRTCMessage] = useState(null);
  const [iceCandidatesFromCaller, setIceCandidatesFromCaller] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [showUserNameInput, setShowUserNameInput] = useState(true);
  const [showCallInput, setShowCallInput] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
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
          console.log(response.data.message);
        }

        if (type === 'call_received') {
          onNewCall(response.data);
        }

        if (type === 'call_answered') {
          onCallAnswered(response.data);
        }

        if (type === 'ICEcandidate') {
          onICECandidate(response.data);
        }
      };
    }
  }, []);

  const connectSocket = () => {
    const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

    callSocketRef.current = new WebSocket(
      wsScheme + window.location.host + '/ws/call/'
    );

    callSocketRef.current.onopen = () => {
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

  const login = (userName) => {
    setMyName(userName);
    setShowUserNameInput(false);
    setShowCallInput(true);
    setShowUserInfo(true);
    connectSocket();
  };

  const call = (userToCall) => {
    setOtherUser(userToCall);
    beReady().then((bool) => {
      processCall(userToCall);
    });
  };

  const answer = () => {
    beReady().then((bool) => {
      processAccept();
    });
    setShowAnswerButton(false);
  };

  const beReady = () => {
    return navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true
      })
      .then((stream) => {
        setLocalStream(stream);
        return createConnectionAndAddStream(stream);
      })
      .catch((e) => {
        alert('getUserMedia() error: ' + e.name);
      });
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
        console.log('Error');
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
              console.log(error);
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
        console.log('Error');
      }
    );
  };

  const createPeerConnection = () => {
    try {
      peerConnectionRef.current = new RTCPeerConnection(pcConfig);
      peerConnectionRef.current.onicecandidate = handleIceCandidate;
      peerConnectionRef.current.onaddstream = handleRemoteStreamAdded;
      peerConnectionRef.current.onremovestream = handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
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
      console.log('End of candidates.');
    }
  };

  const handleRemoteStreamAdded = (event) => {
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
    callSocketRef.current.send(
      JSON.stringify({
        type: 'ICEcandidate',
        data
      })
    );
  };

  const callProgress = () => {
    setShowCalling(false);
    setShowInCall(true);
    setShowVideos(true);
    setCallInProgress(true);
  };

  const stop = () => {
    localStream.getTracks().forEach((track) => track.stop());
    setCallInProgress(false);
    peerConnectionRef.current.close();
    peerConnectionRef.current = null;
    setShowCallInput(true);
    setShowAnswerButton(false);
    setShowInCall(false);
    setShowCalling(false);
    setOtherUser(null);
  };

  return (
    <div className="container">
      {showUserNameInput && <UserLogin onLogin={login} />}
      {showCallInput && <CallInput onCall={call} />}
      {showUserInfo && <UserInfo userName={myName} />}
      {showAnswerButton && <AnswerButton onAnswer={answer} />}
      {showCalling && <CallingStatus otherUser={otherUser} />}
      {showInCall && <InCallStatus otherUser={otherUser} onStop={stop} />}
      {showVideos && <Videos localStream={localStream} remoteStream={remoteStream} />}
    </div>
  );
};

export default VideoCall;
