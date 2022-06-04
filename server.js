const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "")));

require('./startup/routes')(app);



  var server = app.listen(port, function(err){
    if (err) console.log("Error in server setup");
    console.log('Server started at http://localhost:' + port);
  });