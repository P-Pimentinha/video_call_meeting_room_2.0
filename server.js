const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;
var server = app.listen(port, function(err){
  if (err) console.log("Error in server setup");
  console.log('Server started at http://localhost:' + port);
});
const io = require("socket.io")(server);


require('./startup/routes')(app);

io.on("connection",(socket) => {
  console.log("socket id is ", socket.id);
});



 