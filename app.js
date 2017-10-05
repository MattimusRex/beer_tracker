var express = require("express");
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
require("./config/passport")(passport); 


var app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(flash());

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

app.set("port", 6576);

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

app.listen(app.get('port'), function(){
    console.log('Express started on localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});