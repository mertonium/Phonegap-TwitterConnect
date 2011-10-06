var express = require('express');

var app = express.createServer();

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});


app.get('/', function(req, res){
  res.redirect('/index.html', 301);
});

app.get('/nextrip/:stopid', function(req, res){
  nextrip.getNextTrip(req.params.stopid, {}, function(departures) {
    res.send(departures);
  });
});

app.get('/my511/:agency/:stopid', function(req, res){
  var prefix = my511.getPrefix(req.params.agency);
  var stop_id = prefix.toString() + req.params.stopid.toString();
  my511.getNextTrip(stop_id, { }, function(departures) {
    res.send(departures);
  });
});

var port = process.env.PORT || 5000;
app.listen(port);