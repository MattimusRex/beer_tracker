var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/create_acct', function(req, res, next) {
    res.render('create_acct', {message: req.flash('message')});
});

router.post('/create_acct', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash:true
}));

router.get('/login', function(req, res, next) {
    res.render('login', {message: req.flash('message')});
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

router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash: true
}));

module.exports = router;