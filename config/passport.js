var local_strategy = require('passport-local').Strategy;
var facebook_strategy = require('passport-facebook').Strategy;
var session = require('express-session');
var mysql = require('mysql');
var bcrypt = require('bcryptjs');
var flash = require('connect-flash');
var config = require('./config');
var pool = require('./dbconnect');

var saltRounds = 10;

module.exports = function(passport) {
    
    passport.serializeUser(function(user, done) {
        done(null, user.id)
    });

    passport.deserializeUser(function(id, done) {
        pool.pool.query("SELECT * FROM beer_tracker.users where id = ?", [id], function(err, rows) {
            done(err, rows[0]);
        });
    });

    passport.use('local-signup', new local_strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true

    }, function(req, email, password, done) {
        if (req.body.password !== req.body.password_dup) {
            return done(null, false, req.flash('message', 'Passwords do not match'));
        }
        pool.pool.query("SELECT * FROM beer_tracker.users WHERE email = ?", [email], function(err, rows) {
            if (err) {
                return done(err);
            }
            if (rows.length) {
                return done(null, false, req.flash('message', 'That email is already taken.'));
            } 
            else {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    var newUserQuery = {
                        email: email,
                        password: hash
                    };
                    var insertQuery = "INSERT INTO beer_tracker.users ( email, password ) values (?,?)";

                    pool.pool.query(insertQuery, [newUserQuery.email, newUserQuery.password], function(err, rows) {
                        newUserQuery.id = rows.insertId;
                        return done(null, newUserQuery, req.flash('message', 'Account Created and Logged In'));
                    });
                });
            }
        });
    }));

    passport.use('local-login', new local_strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function(req, email, password, done) {
        pool.pool.query("SELECT * FROM beer_tracker.users WHERE email = ?", [email], function(err, rows) {
            if (err) {
                return done(err);
            }
            if (!rows.length) {
                return done(null, false, req.flash('message', 'Email address not found'));
            }
            bcrypt.compare(password, rows[0].password, function(err, res) {
                // res == true
                if (res) {
                    return done(null, rows[0], req.flash('message', 'Login Successful'));
                } else {
                    return done(null, false, req.flash('message', 'Incorrect Password'));
                }
            });
        });
    }));

    passport.use('facebook', new facebook_strategy ({
       clientID: config.config.clientID,
       clientSecret: config.config.clientSecret,
       callbackURL: 'http://localhost:6576/user/auth/facebook/callback',
       passReqToCallback: true
    }, 
    function(req, accessToken, refreshToken, profile, done) {
        pool.pool.query("SELECT * FROM beer_tracker.users WHERE user_id = ?", [profile.id], function(err, rows) {
            if (err) {
                return done(err);
            }
            if (!rows.length) {
                pool.pool.query("INSERT INTO beer_tracker.users (user_id) values (?)", [profile.id], function(err, rows) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, profile, req.flash('message', "Account Created and Logged In"));
                });
            }
            else {
                return done(null, rows[0], req.flash('message', 'Login Successful'));
            }
        });  
    })); 
};