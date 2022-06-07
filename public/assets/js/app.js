
var AppProcess= (function(){
    var peers_connection_ids = [];
    var peers_connection = [];
    var serverProcess;
    var remote_vid_stream = [];
    var remote_aud_stream = [];
    var local_div;
    var audio;
    var isAudioMute = true;
    var rtp_aud_senders = [];
    var video_states = {
        None:0,
        Camera:1,
        ScreenShare:2
    }
    var video_st = video_states.None;
    var videoCamTrack;

    async function _init(SDP_function, my_connid){
        serverProcess = SDP_function;
        my_connection_id = my_connid;
        eventProcess();
        local_div = document.getElementById("localVideoPlayer");
    }

    function eventProcess() {
        $("#miceMuteUnmute").on("click", async function(){
            if(!audio){
                await loadAudio();
            }
            if(!audio){
                alert("Audio permission was not granted");
                return
            }
            if(isAudioMute){
                audio.enable = true;
                $(this).html("<span class='material-icons'>mic</span>");
                updateMediaSenders(audio, rtp_aud_senders);
            }else{
                audio.enable = false;
                $(this).html("<span class='material-icons'>mic_off</span>");
                removeMediaSenders(rtp_aud_senders);
            }
            isAudioMute = !isAudioMute;
        });

        $("#videoCamOnOff").on("click", async function(){
            if(video_st == video_states.Camera){
                await videoProcess(video_states.None);
            }else{
                await videoProcess(video_states.Camera);
            }
        });

        $("#ScreenShareOnOff").on("click", async function(){
            if(video_st == video_states.ScreenShare){
                await videoProcess(video_states.None);
            }else{
                await videoProcess(video_states.ScreenShareOnOff);
            }
        })
    }

    async function videoProcess(newVideoState){
        try{
            var vstream = null;
            if(newVideoState == video_states.Camera){
               vstream = await navigator.mediaDevices.getUserMedia({
                    video:{
                        width:1920,
                        height: 1080
                    },
                   audio: false 
                })
            }else if(newVideoState == video_states.ScreenShare){
                vstream = await navigator.mediaDevices.getDisplayMedia({
                    video:{
                        width:1920,
                        height: 1080
                    },
                   audio: false 
                });
            }
            if(vstream && vstream.getVideoTracks().length > 0){
                videoCamTrack = vstream.getVideoTracks()[0];
                if(videoCamTrack){
                   local_div.srcObject = new MediaStream([videoCamTrack]);
                   $("#meetingContainer").show();
                   alert ("I am working")
                }
            }
        }catch(e){
            console.log(e);
        }
        video_st = newVideoState; 
    }

    var iceConfiguration = {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
          {
            urls: "stun:stun1.l.google.com:19302",
          },
        ],
      };

    async function setNewConnection(connId){
        var connection = new RTCPeerConnection(iceConfiguration);
        
        connection.onnegotiationneeded = async function(event) {
            await setOffer(connId);
        };

        connection.onicecandidate = function(event){
            if(event.candidate){
                serverProcess(JSON.stringify({icecandidate:event.candidate }), connId);
            }
        };

        connection.ontrack = function(event){
           if(!remote_vid_stream[connId]){
               remote_vid_stream[connId] = new MediaStream();
           }
           if(!remote_aud_stream[connId]){
            remote_aud_stream[connId] = new MediaStream();
        }

            if(event.track.kind == "video"){
                remote_vid_stream[connId]
                .getVideoTracks()
                .forEach((t)=> remote_vid_stream[connId].removeTrack(t));
                remote_vid_stream[connId].addTrack(event.track);
                var remoteVideoPlayer = document.getElementById("v_"+connId);
                remoteVideoPlayer.srcObject = null;
                remoteVideoPlayer.srcObject = remote_vid_stream[connId];
                remoteVideoPlayer.load();
            }else if(event.track.kind == "audio"){
                remote_aud_stream[connId]
                .getAudioTracks()
                .forEach((t)=> remote_aud_stream[connId].removeTrack(t));
                remote_aud_stream[connId].addTrack(event.track);
                var remoteAudioPlayer = document.getElementById("a_"+connId);
                remoteAudioPlayer.srcObject = null;
                remoteAudioPlayer.srcObject = remote_aud_stream[connId];
                remoteAudioPlayer.load();
            }
        };
        peers_connection_ids[connId] = connId;
        peers_connection[connId] = connection;

        return connection;
    }

    async function setOffer(connId){
        var connection = peers_connection[connId];
        var offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        serverProcess(JSON.stringify({offer: connection.localDescription }), connId);
    }

    async function SDPProcess (message, from_connid){
        message = JSON.parse(message);
        if(message.answer){
            await peers_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.answer))

        }else if(message.offer){
            if(!peers_connection[from_connid]){
                await setNewConnection(from_connid)
            }
            await peers_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.offer))
            var answer = await peers_connection[from_connid].createAnswer();
            await peers_connection[from_connid].setLocalDescription(answer);
            serverProcess(JSON.stringify({answer: answer }), from_connid);
        }else if(message.icecandidate){
            if(!peers_connection[from_connid]){
                await setNewConnection(from_connid);
            }
            try{
                peers_connection[from_connid].addIceCandidate(message.icecandidate);
            }catch(e){
                console.log(e);
            }
        }
    }

    return{
        setNewConnection: async function(connId){
            await setNewConnection(connId);
        },
        init: async function(SDP_function, my_connid){
            await _init(SDP_function, my_connid)
        },
        processClientFunc: async function(data, from_connid){
            await SDPProcess(data, from_connid)
        },
    }
})();

var MyApp = (function(){

    var socket = null;
    var user_id = "";
    var meeting_id = "";

    function init(uid, mid){ 
        user_id = uid;
        meeting_id = mid;
        $("#meetingContainer").show();
        $("#me h2").text(user_id + "(Me)");
        document.title = user_id;
        event_process_for_signaling_server();
    }

    /* event_process_for_signaling_server(); */
    
    function event_process_for_signaling_server() {
    socket = io.connect();

    var SDP_function = function (data, to_connid) {
      socket.emit("SDPProcess", {
        message: data,
        to_connid: to_connid,
      });
    };
    socket.on("connect", () => {
      if (socket.connected) {
        AppProcess.init(SDP_function, socket.id);
        if (user_id != "" && meeting_id != "") {
          socket.emit("userconnect", {
            displayName: user_id,
            meetingid: meeting_id,
          });
        }
      }
    });
    socket.on("inform_other_about_disconnected_user", function (data) {
      $("#" + data.connId).remove();
      $(".participant-count").text(data.uNumber);
      $("#participant_" + data.connId + "").remove();
      AppProcess.closeConnectionCall(data.connId);
    });
    // <!-- .....................HandRaise .................-->

    socket.on("HandRaise_info_for_others", function (data) {
      if (data.handRaise) {
        $("#hand_" + data.connId).show();
      } else {
        $("#hand_" + data.connId).hide();
      }
    });
    // <!-- .....................HandRaise .................-->

    socket.on("inform_others_about_me", function (data) {
      addUser(data.other_user_id, data.connId, data.userNumber);

      AppProcess.setNewConnection(data.connId);
    });
    socket.on("showFileMessage", function (data) {
      var num_of_att = $(".left-align").length;
      var added_mar = num_of_att * 10;
      var mar_top = "-" + (135 + added_mar);
      $(".g-details").css({ "margin-top": mar_top });

      var time = new Date();
      var lTime = time.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      var attachFileAreaForOther = document.querySelector(".show-attach-file");

      attachFileAreaForOther.innerHTML +=
        "<div class='left-align' style='display:flex; align-items:center;'><img src='public/assets/images/other.jpg' style='height:40px;width:40px;' class='caller-image circle'><div style='font-weight:600;margin:0 5px;'>" +
        data.username +
        "</div>:<div><a style='color:#007bff;' href='" +
        data.filePath +
        "' download>" +
        data.fileName +
        "</a></div></div><br/>";
    });
    socket.on("inform_me_about_other_user", function (other_users) {
      var userNumber = other_users.length;
      var userNumb = userNumber + 1;
      if (other_users) {
        for (var i = 0; i < other_users.length; i++) {
          addUser(
            other_users[i].user_id,
            other_users[i].connectionId,
            userNumb
          );
          AppProcess.setNewConnection(other_users[i].connectionId);
        }
      }
    });
    socket.on("SDPProcess", async function (data) {
      await AppProcess.processClientFunc(data.message, data.from_connid);
    });
    socket.on("showChatMessage", function (data) {
      var time = new Date();
      var lTime = time.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      var div = $("<div>").html(
        "<span class='font-weight-bold mr-3' style='color:black'>" +
          data.from +
          "</span>" +
          lTime +
          "</br>" +
          data.message
      );
      $("#messages").append(div);
    });
  }

    function addUser (other_user_id, connId) {
        var newDivId = $("#otherTemplate").clone();
        newDivId = newDivId.attr("id", connId).addClass("other");
        newDivId.find("h2").text(other_user_id);
        newDivId.find("video").attr("id", "v_" + connId);
        newDivId.find("audio").attr("id", "a_" + connId);
        newDivId.show();
        $("#divUsers").append(newDivId);
    }

    return {
        _init: function(uid, mid){
            init(uid, mid);
        }
    }
})();

