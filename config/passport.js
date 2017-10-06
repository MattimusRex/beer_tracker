var local_strategy = require('passport-local').Strategy;
var facebook_strategy = require('passport-facebook').Strategy;
var session = require('express-session');
var mysql = require('mysql');
var bcrypt = require('bcryptjs');
var flash = require('connect-flash');
var config = require('./config');
var pool = require('./dbconnect');
var mailer = require("./mailer.js");
var crypto = require("crypto");

function create_verification_id() {
    return crypto.randomBytes(48).toString('hex');
}

var saltRounds = 10;

module.exports = function(passport) {
    
    passport.serializeUser(function(user, done) {
        done(null, user.id)
    });

    passport.deserializeUser(function(id, done) {
        pool.pool.query("SELECT * FROM beer_tracker.users where id = ?", [id], function(err, rows) {
            if (!rows.length) {
                done(err, null);
            }
            done(err, rows[0]);
        });
    });

    passport.use('local-signup', new local_strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true

    }, function(req, email, password, done) {
        if (req.body.password !== req.body.password_dup) {
            return done(null, false, req.flash('error_message', 'Passwords do not match'));
        }
        pool.pool.query("SELECT * FROM beer_tracker.users WHERE email = ?", [email], function(err, rows) {
            if (err) {
                return done(err);
            }
            if (rows.length) {
                return done(null, false, req.flash('error_message', 'That email is already taken.'));
            } 
            var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{12,}/;
            if (!re.test(password)) {
                return done(null, false, req.flash('error_message', 'Your password must be at least 12 characters long and contain 1 number, 1 uppercase letter, and 1 lowercase letter.'));
            }
            else {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    var newUserQuery = {
                        email: email,
                        password: hash
                    };
                    var verification_id = create_verification_id();

                    pool.pool.query("INSERT INTO beer_tracker.users ( email, password, active, verification_id ) values (?, ?, 0, ?)", [newUserQuery.email, newUserQuery.password, verification_id], function(err, rows) {
                        newUserQuery.id = rows.insertId;
                        mailer.send_verification_mail(newUserQuery.email, verification_id);
                        return done(null, newUserQuery, req.flash('message', 'Verification Email Sent.  Please click the link in the email to finish creating your account.'));
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
                return done(null, false, req.flash('error_message', 'Email address not found'));
            }
            if (rows[0].active == 0) {
                return done(null, false, req.flash('error_message', 'That email address needs to be verified.'));
            }
            bcrypt.compare(password, rows[0].password, function(err, res) {
                // res == true
                if (res) {
                    return done(null, rows[0], req.flash('message', 'Login Successful'));
                } else {
                    return done(null, false, req.flash('error_message', 'Incorrect Password'));
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
                pool.pool.query("INSERT INTO beer_tracker.users (user_id, active) values (?, 1)", [profile.id], function(err, rows) {
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