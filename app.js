var express = require("express");
var handlebars = require("express-handlebars").create({defaultLayout:"main"});
var bodyParser = require("body-parser");
var mysql = require('mysql');
var passport = require("passport");
var session = require("express-session");
var flash = require("connect-flash");
var my_sql_store = require('express-mysql-session')(session);

var app = express();

require("./config/passport")(passport);
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(flash());

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

app.set("port", 6576);
var pool = mysql.createPool({
    host  : 'localhost',
    user  : 'root',
    password: 'testPassword',
    database: 'beer_tracker'
});

var session_store = new my_sql_store({}, pool);

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

function ensureAthenticated(req, res, next){
	if(req.isAuthenticated()) {
		return next();
	} else {
        req.flash('message', 'You must be logged in to access that page.');
		res.redirect('/login');
	}
};

app.get('/', function(req, res, next) {
    res.render('home', {message: req.flash('message')});
});

app.get('/add_beer', ensureAthenticated, function(req, res, next) {
    res.render('add_beer');
});

app.get('/view_beers', ensureAthenticated, function(req, res, next) {
    pool.query("SELECT B.id, B.name, B.style, B.rating, B.review, B.location FROM beer_tracker.beers B INNER JOIN beer_tracker.users U ON U.id = B.user_id WHERE U.id = ?", 
    [req.user.id], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        var payload = {};
        payload.rows = rows;
        res.render('view_beers', payload);
    });
});

app.get('/logout', function(req, res) {
	req.logout();
	req.flash('message', 'You are logged out');
	res.redirect('/')
	
});

app.get('/create_acct', function(req, res, next) {
    res.render('create_acct', {message: req.flash('message')});
});

app.get('/login', function(req, res, next) {
    res.render('login', {message: req.flash('message')});
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.post('/beer', function(req, res, next) {
    pool.query("INSERT INTO beer_tracker.beers (name, style, rating, review, location, user_id) VALUES (?, ?, ?, ?, ?, ?)", [req.body.beer_name,
        req.body.beer_style, req.body.beer_rating, req.body.beer_review, req.body.beer_location, req.user.id], function(err, result) {
            if (err) {
                next(err);
                return;
            }
            req.flash('message', "Beer Added Successfully");
            res.render('add_beer', {message: req.flash('message')});
    });
});

app.delete('/beer', function(req, res, next) {
    pool.query("DELETE FROM beer_tracker.beers WHERE id = ?", [req.body.id], function (err, result) {
        if (err) {
            next(err);
            return;
        }
        res.render('view_beers');
    });
});

app.post('/edit_beer', function(req, res, next) {
    pool.query("UPDATE beer_tracker.beers SET name = ?, style = ?, rating = ?, review = ?, location = ? WHERE id = ? ", 
    [req.body.beer_name, req.body.beer_style, req.body.beer_rating, req.body.beer_review, req.body.beer_location, req.body.beer_id], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('view_beers');
    });
});

app.post('/create_acct', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/create_acct',
    failureFlash:true
}));

app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash:true
}));

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