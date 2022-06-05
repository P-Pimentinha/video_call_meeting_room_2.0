
module.exports = function (app) {
  const port = process.env.PORT || 8080;
  app.listen(port, function(err){
    if (err) console.log("Error in server setup");
    console.log('Server started at http://localhost:' + port);
  });
} 