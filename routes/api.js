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
        res.json(rows);
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
        if (rows.length) {
            res.json(rows);
        }
        else {
            res.sendStatus(404);
        }
    });
});

//create a new beer under a specific account
router.post('/beers', function(req, res, next) {
    pool.pool.query("INSERT INTO beer_tracker.beers (name, style, rating, review, location, user_id) VALUES (?, ?, ?, ?, ?, ?)", [req.body.beer_name,
        req.body.beer_style, req.body.beer_rating, req.body.beer_review || null, req.body.beer_location || null, req.user.id], function(err, result) {
            if (err) {
                next(err);
                return;
            }
            else {
                pool.pool.query("SELECT name, style, rating, review, location FROM beer_tracker.beers WHERE id = ?" , [result.insertId], function (err, rows, fields) {
                    if (err) {
                        next(err);
                        return;
                    }
                    res.location('/api/beers/' + result.insertId);
                    res.status(201).json(rows);
                });
            }
    });
});

//edit all of specific beer
router.put('/beers/:id', function(req, res, next) {
    pool.pool.query("UPDATE beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id SET B.name = ?, B.style = ?, B.rating = ?, B.review = ?, B.location = ? WHERE U.id = ? AND B.id = ?", 
    [req.body.beer_name, req.body.beer_style, req.body.beer_rating, req.body.beer_review || null, req.body.beer_location || null, req.user.id, req.params.id], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        pool.pool.query("SELECT B.name, B.style, B.rating, B.review, B.location FROM beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id WHERE U.id = ? AND B.id = ?", 
        [req.user.id, req.params.id], function (err, rows, fields) {
            if (err) {
                next(err);
                return;
            }
            res.json(rows);
        });
    });
});

//edit part of a specific beer
router.patch('/beers/:id', function(req, res, next) {
    pool.pool.query("SELECT B.name, B.style, B.rating, B.review, B.location FROM beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id WHERE U.id = ? AND B.id = ?", 
    [req.user.id, req.params.id], function (err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        pool.pool.query("UPDATE beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id SET B.name = ?, B.style = ?, B.rating = ?, B.review = ?, B.location = ? WHERE U.id = ? AND B.id = ?",
        [req.body.beer_name || rows[0].name, req.body.beer_style || rows[0].style, req.body.beer_rating || rows[0].rating, req.body.beer_review || rows[0].review, req.body.beer_location || rows[0].location,
        req.user.id, req.params.id], function(err, rows, fields) {
            if (err) {
                next(err);
                return;
            }
            pool.pool.query("SELECT B.name, B.style, B.rating, B.review, B.location FROM beer_tracker.beers B INNER JOIN beer_tracker.users U on U.id = B.user_id WHERE U.id = ? AND B.id = ?", 
            [req.user.id, req.params.id], function (err, rows, fields) {
                if (err) {
                    next(err);
                    return;
                }
                res.json(rows);
            });
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