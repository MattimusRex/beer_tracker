var express = require('express');
var router = express.Router();
var pool = require('../config/dbconnect');

//API routes
//get all beers with a specific user account
router.get('/beers', function(req, res, next) {
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

//get specific beer with a specific user account
router.get('/beers/:id', function(req, res, next) {
    pool.pool.query("SELECT B.id, B.name, B.style, B.rating, B.review, B.location FROM beer_tracker.beers B INNER JOIN beer_tracker.users U ON U.id = B.user_id WHERE U.id = ? AND B.id = ?",
    [req.user.id, req.params.id], function(err, rows, fields)  {
        if (err) {
            next(err);
            return;
        }
        if (rows[0]) {
            var payload = {};
            payload.rows = rows;
            res.render('view_beers', payload);
        }
        else {
            console.log(req.params.id);
            res.sendStatus(404);
        }
    });
});

//create a new beer under a specific account
router.post('/beers', function(req, res, next) {
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

//edit all of specific beer
router.put('/beers/:id', function(req, res, next) {
    pool.pool.query("UPDATE beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id SET B.name = ?, B.style = ?, B.rating = ?, B.review = ?, B.location = ? WHERE U.id = ? AND B.id = ?", 
    [req.body.beer_name, req.body.beer_style, req.body.beer_rating, req.body.beer_review, req.body.beer_location, req.user.id, req.params.id], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('view_beers');
    });
});

//edit part of a specific beer
router.put('/beers/:id', function(req, res, next) {
    pool.pool.query("SELECT B.name, B.style, B.rating, B.review, B.location FROM beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id WHERE U.id = ? AND B.id = ?", 
    [req.user.id, req.params.id], function (err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        var results = rows;
        pool.pool.query("UPDATE beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id SET B.name = ?, B.style = ?, B.rating = ?, B.review = ?, B.location = ? WHERE U.id = ? AND B.id = ?",
        [req.body.beer_name || results.name, req.body.beer_style || results.style, req.body.beer_rating || results.rating, req.body.beer_review || results.review, req.body.beer_location || results.location,
        req.user.id, req.params.id], function(err, rows, fields) {
            if (err) {
                next(err);
                return;
            }
            res.redirect('view_beers');
        });
    });
});

//delete a specific beer
router.delete('/beers/:id', function(req, res, next) {
    pool.pool.query("DELETE B FROM beer_tracker.beers B INNER JOIN beer_tracker.users U ON U.id = B.user_id WHERE U.id = ? AND B.id = ?", [req.user.id, req.params.id], function(err, result) {
        if (err) {
            next(err);
            return;
        }
        res.sendStatus(200);
    });
});

module.exports = router;