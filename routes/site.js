var express = require('express');
var router = express.Router();
var pool = require('../config/dbconnect');

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()) {
		return next();
	} else {
        req.flash('message', 'You must be logged in to access that page.');
		res.redirect('/user/login');
	}
};

//website routes
router.get('/', function(req, res, next) {
    res.render('home', {message: req.flash('message')});
});

router.get('/add_beer', ensureAuthenticated, function(req, res, next) {
    res.render('add_beer');
});

router.post('/add_beer', ensureAuthenticated, function(req, res, next) {
    pool.pool.query("INSERT INTO beer_tracker.beers (name, style, rating, review, location, user_id) VALUES (?, ?, ?, ?, ?, ?)", [req.body.beer_name,
        req.body.beer_style, req.body.beer_rating, req.body.beer_review, req.body.beer_location, req.user.id], function(err, result) {
            if (err) {
                next(err);
                return;
            }
            req.flash('message', "Beer Added Successfully");
            res.render('add_beer', {message: req.flash('message')});
    });
});

router.post('/edit_beer', function(req, res, next) {
    pool.pool.query("UPDATE beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id SET B.name = ?, B.style = ?, B.rating = ?, B.review = ?, B.location = ? WHERE U.id = ? AND B.id = ?", 
    [req.body.beer_name, req.body.beer_style, req.body.beer_rating, req.body.beer_review, req.body.beer_location, req.user.id, req.body.beer_id], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        res.sendStatus(200);
    });
});

router.get('/view_beers', ensureAuthenticated, function(req, res, next) {
    pool.pool.query("SELECT B.id, B.name, B.style, B.rating, B.review, B.location FROM beer_tracker.beers B INNER JOIN beer_tracker.users U ON U.id = B.user_id WHERE U.id = ?", 
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

module.exports = router;