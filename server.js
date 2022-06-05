const express = require('express');
const app = express();
/* const path = require('path'); */

/* Express server */
const port = process.env.PORT || 8080;
var server = app.listen(port, function(err){
    if (err) console.log("Error in server setup");
    console.log('Server started at http://localhost:' + port);
  });

  /* Socket Io Server */
const io = require("socket.io")(server);

require('./startup/routes')(app);



io.on("connection",(socket) => {
  console.log("socket id// is ", socket.id);
});



 