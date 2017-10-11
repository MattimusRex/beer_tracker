var express = require('express');
var router = express.Router();
var passport = require('passport');
var pool = require('../config/dbconnect');
var mailer = require("../config/mailer.js");

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

router.get('/resend_verification', function(req, res) {
    res.render('resend_verification');
});

router.post('/resend_verification', function(req, res) {
    pool.pool.query("SELECT email, verification_id, active FROM beer_tracker.users WHERE email = ?", [req.body.email], function (err, results, fields) {
        if (err) {
            next(err);
            return;
        }
        //email found and not verified
        if (results.length && results[0].active == 0) {
            mailer.send_verification_mail(results[0].email, results[0].verification_id);
            req.flash('message', 'Verification email sent');
            res.render('home', {message: req.flash('message')})
        }
        //email found but already verified
        else if (results.length && results[0].active == 1) {
            req.flash('error_message', 'That email has already been verified');
            res.render('resend_verification', {error_message: req.flash('error_message')});
        }
        //email address not found
        else {
            req.flash('error_message', 'No account with that email address found.');
            res.render('resend_verification', {error_message: req.flash('error_message')});
        }
    });
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
            res.render("verification_result", context);
        }
        else {
            let context = {
                result : "Verification Succeeded! Please log in."
            }
            res.render("verification_result", context);
        }
    });
});

module.exports = router;