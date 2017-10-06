var express = require('express');
var router = express.Router();
var passport = require('passport');
var pool = require('../config/dbconnect');

router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash: true
}));

router.get('/create_acct', function(req, res, next) {
    res.render('create_acct', {message: req.flash('message'), error_message: req.flash('error_message')});
});

router.post('/create_acct', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash:true,
    session: false
}));

router.get('/login', function(req, res, next) {
    res.render('login', {message: req.flash('message'), error_message: req.flash('error_message')});
});

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash:true
}));

router.get('/logout', function(req, res) {
	req.logout();
	req.flash('message', 'You are logged out');
	res.redirect('/')
});

router.get('/verification/:id', function(req, res) {
    pool.pool.query("UPDATE beer_tracker.users SET active = 1, verification_id = null WHERE verification_id = ?", [req.params.id], function(err, results, fields) {
        if (err) {
            next(err);
            return;
        }
        if (results.affectedRows == 0) {
            let context = {
                result : "Verification Failed.  Either your account is already verified or you need to create an account."
            }
            res.render("verification", context);
        }
        else {
            let context = {
                result : "Verification Succeeded! Please log in."
            }
            res.render("verification", context);
        }
    });
});

module.exports = router;