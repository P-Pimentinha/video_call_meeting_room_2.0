
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
                other_users: data.displayName,
                connId: socket.id
                
              })
          })

          socket.emit("inform_me_about_other_user", other_users);

        })

        socket.on("SDPProcess", (data) => {
          socket.to(data.to_connid).emit("SDPProcess", {
            message: data.message,
            from_connid: socket.id,
          });
        });
        

      });
      
}