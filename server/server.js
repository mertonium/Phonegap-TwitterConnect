var express = require('express'),
    cradle = require('cradle'),
    http = require('http');

var config = {
  couchhost: 'localhost',
  couchport: '5984',
  auth: {
    username: 'admin',
    password: 'admin'
  }
};

var couch = new(cradle.Connection)({ host: 'http://'+config.couchhost, port: config.couchport, auth: config.auth});
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
      var respObj = {}, options, authReq;

      if(err) {
        res.send(err, 404);
      } else {
        if(doc.length) {
          console.log(doc);
          respObj.cleartext = doc[0];

          // Get the session auth cookie
          options = {
            host: config.couchhost,
            port: config.couchport,
            path: '/_session',
            method: 'POST',
            headers: {
              "Content-Type":"application/x-www-form-urlencoded"
            }
          };

          authReq = http.request(options, function(authRes) {
            var authCookie = authRes.headers['set-cookie'][0].split(';').shift() || null;
            var reqBody = '';

            authRes.setEncoding('utf8');
            authRes.on('data', function (chunk) {
              reqBody += chunk;
            });

            authRes.on('end', function(){
              if(typeof reqBody === 'string') {
                reqBody = JSON.parse(reqBody);
              }

              if(reqBody.ok && reqBody.ok === true) {
                console.log('everything worked');
                console.log(authCookie);
                delete respObj.cleartext;
                respObj.name = reqBody.name;
                respObj.cookie = authCookie;
                res.send(respObj);
              }
            });
          });

          authReq.on('error', function(e) {
            var msg = 'problem with request: ' + e.message;
            console.log(msg);
            res.send(msg);
          });

          // write data to request body
          authReq.write("name="+username+"&password="+respObj.cleartext);
          authReq.end();
        } else {
          res.send(username+' does not exist.', 404);
        }
      }
  });
});

var port = process.env.PORT || 5000;
app.listen(port);