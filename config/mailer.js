var nodemailer = require("nodemailer");
var handlebars = require("nodemailer-express-handlebars");
var config = require("./config");

var transporter = nodemailer.createTransport({
   service: "gmail",
   auth : {
       user : config.config.email_user,
       pass : config.config.email_pass
   },
   port : 465,
   secure : true 
});

var options = {
    viewEngine : handlebars.engine,
    viewPath : "./views"
};

transporter.use("compile", handlebars(options));

module.exports = {
    send_verification_mail : function (rec_email, ver_id) {
        var mail_options = {
            from : config.config.email_user,
            to : rec_email,
            subject : "Beer Tracker Account Verification",
            template : "verification_email",
            context : {
                verification_id : ver_id
            }
        };

        transporter.sendMail(mail_options, function(err, info) {
            if (err) {
                console.log(err);
            }
        });
    }
};