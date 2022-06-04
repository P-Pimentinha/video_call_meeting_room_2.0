const path = require('path');
const express = require('express');

module.exports = function(app){

    app.use(express.static(path.join(__dirname, "..")));

    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname, '../index.html'));
      });
      
    app.get('/action', function(req, res) {
          res.sendFile(path.join(__dirname, '../action.html'));
        });
}