var express = require('express'),
    cradle = require('cradle');

var config = {
  couchhost: 'http://localhost',
  couchport: '5984',
  auth: {
    username: 'admin',
    password: 'admin'
  }
};

var couch = new(cradle.Connection)({ host: config.couchhost, port: config.couchport, auth: config.auth});
var app = express.createServer();

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'idonttoleratewheat'}));
  app.use(app.router);
});

app.configure('development', function(){
  //app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  //app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.send('Nothing to see here.');
});

app.post('/auth', function(req, res){
  
  var twitterid = req.body.twitterid;
  var authtoken = req.body.authtoken;
  var username = req.body.username;
  
  console.log('twitterid = '+ twitterid);
  console.log('authtoken = '+ authtoken);
  
  // TODO: Insert the verification with Twitter (or more oauth providers) here
  
  // Get the user's password from the couch
  couch.database('_users').list('users/arrayvalues/usernames', 
    { key : username }, 
    function(err, doc) {
      var respObj = {};
      
      if(err) {
        res.send(err, 404);
      } else {
        if(doc.length) {
          console.log(doc);
          respObj.cleartext = doc[0];
          res.send(respObj);
        } else {
          res.send(username+' does not exist.', 404);
        }
      }
  });
});

var port = process.env.PORT || 5000;
app.listen(port);