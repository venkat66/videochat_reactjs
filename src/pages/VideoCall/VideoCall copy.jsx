import React, { useState, useRef, useEffect } from 'react';
import UserLogin from '../../components/UserLogin';
import CallInput from '../../components/CallInput';
import UserInfo from '../../components/UserInfo';
import AnswerButton from '../../components/AnswerButton';
import CallingStatus from '../../components/CallingStatus';
import InCallStatus from '../../components/InCallStatus';
import Videos from '../../components/Videos';
import { HOST } from '../../api/api';

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

 

  const connectSocket = (userName) => {

    callSocketRef.current = new WebSocket(
      HOST + '/ws/call/'
    );

    callSocketRef.current.onopen = () => {
      console.log(myName,'myssss')
      console.log(userName,'user on opennnnnn')
      callSocketRef.current.send(
        JSON.stringify({
          type: 'login',
          data: {
            name: userName
          }
        })
      );
    };
  };

  const login = (userName) => {
    console.log(userName,'username on login')
    setMyName(userName);
    setShowUserNameInput(false);
    setShowCallInput(true);
    setShowUserInfo(true);
    connectSocket(userName);
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

  const beReady = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      console.log('stream');
      setLocalStream(stream);
      return await createConnectionAndAddStream(stream);
    } catch (e) {
      alert('getUserMedia() error: ' + e.name);
    }
  };
  

  const createConnectionAndAddStream = (stream) => {
    console.log('createConnectionAndAddStream')
    createPeerConnection();
    peerConnectionRef.current.addStream(stream);
    return true;
  };

  const processCall = (userName) => {
    console.log("processCall",userName)
    peerConnectionRef.current.createOffer(
      (sessionDescription) => {
        peerConnectionRef.current.setLocalDescription(sessionDescription);
        console.log(sessionDescription,'sessionDescription')
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
    console.log('processAccept')
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
    console.log(event,'handleIceCandidate')
    if (event.candidate) {
      console.log("event candidate present")
      sendICEcandidate({
        user: "ram",
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
    console.log('nnnnnn')
    console.log(event)
    setRemoteStream(event.stream);
  };

  const handleRemoteStreamRemoved = () => {
    setRemoteStream(null);
    setLocalStream(null);
  };

  const sendCall = (data) => {
    console.log(data,'send call datttta')
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
    console.log(data,'answercall dataaaa')
    callSocketRef.current.send(
      JSON.stringify({
        type: 'answer_call',
        data
      })
    );
    callProgress();
  };

  const sendICEcandidate = (data) => {
    console.log(data, "sendICEcandidate");

    if (callSocketRef.current.readyState === WebSocket.OPEN) {
        callSocketRef.current.send(JSON.stringify({
            type: "ICEcandidate",
            data
        }));
    } else {
        console.error("WebSocket is not open. Ready state: " + callSocketRef.current.readyState);
    }
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
  useEffect(() => {
    if (callSocketRef.current) {
      console.log('current oconneeeeeee')
      callSocketRef.current.onmessage = (e) => {
        console.log(e,'currrenn on message eee')
        const response = JSON.parse(e.data);
        const type = response.type;

        if (type === 'connection') {
          console.log('connectionnnnn')
          console.log(response.data.message);
        }

        if (type === 'call_received') {
          console.log("call receivedddd")
          onNewCall(response.data);
        }

        if (type === 'call_answered') {
          console.log('call answereddddd')
          onCallAnswered(response.data);
        }

        if (type === 'ICEcandidate') {
          console.log('icecandiddddat on connnn')
          sendICEcandidate(response.data);
        }
      };
    }
  }, []);
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
