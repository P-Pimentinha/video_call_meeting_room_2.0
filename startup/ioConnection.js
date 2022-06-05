
var userConnections = [];

module.exports = function(io){

    io.on("connection",(socket) => {
        console.log("socket id// is ", socket.id);
        socket.on("userconnect", (data) => {

        console.log("userconnect", data.displayName, data.meetingid);

        var other_users = userConnections.filter((p) => 
        p.meeting_id == data.meetingid);

          userConnections.push({
              connectionId: socket.id,
              user_id: data.displayName,
              meeting_id: data.meetingid,
          })

          other_users.forEach((v) => {
              socket.to(v.connectionId).emit("inform_others_about_me", {
                other_iser_id: data.displayName,
                connId: socket.id
              })
          })

        })
      });
      
}