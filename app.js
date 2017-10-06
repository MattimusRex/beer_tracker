var express = require("express");
var fs = require("fs");
var handlebars = require("express-handlebars").create({defaultLayout:"main"});
var bodyParser = require("body-parser");
var mysql = require('mysql');
var passport = require("passport");
var session = require("express-session");
var flash = require("connect-flash");
var my_sql_store = require('express-mysql-session')(session);
var site_routes = require('./routes/site')
var user_routes = require('./routes/user');
var api_routes = require('./routes/api');
var pool = require('./config/dbconnect');
var https = require('https');
require("./config/passport")(passport); 


var app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(flash());

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

app.set("http_port", 6576);
app.set("https_port", 6577);
var https_options = {
    key : fs.readFileSync("C:/Users/Matt/Documents/OpenSSL/bin/server.key"),
    cert : fs.readFileSync("C:/Users/Matt/Documents/OpenSSL/bin/server.crt")
};

var session_store = new my_sql_store({}, pool.pool);

app.use(session({
    key: 'session_cookie',
    secret: 'secret',
    resave: false,
    store: session_store,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
    res.locals.user = req.user || null;
    next();
});

app.all("*", function(req, res, next) {
    if (req.secure) {
        return next();
    }
    res.redirect("https://localhost:" + app.get("https_port") + req.url);
});

app.use('/', site_routes)
app.use('/user', user_routes);
app.use('/api', api_routes);

app.use(function(req,res){
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
  });
  
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.send('500 - Server Error');
  });

app.listen(app.get('http_port'), function(){
    console.log('Express http started on localhost:' + app.get('http_port') + '; press Ctrl-C to terminate.');
});
var secure_server = https.createServer(https_options, app).listen(app.get("https_port"), function() {
    console.log('Express https started on localhost:' + app.get('https_port') + '; press Ctrl-C to terminate.');    
});