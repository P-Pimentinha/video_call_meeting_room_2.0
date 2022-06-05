const express = require('express');
const app = express();
/* const path = require('path'); */


const server = require('./startup/expressServer')(app);
const io = require("socket.io")(server);

require('./startup/routes')(app);

io.on("connection",(socket) => {
  console.log("socket id is ", socket.id);
});



 