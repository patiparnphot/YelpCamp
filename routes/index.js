var express = require("express"),
    router  = express.Router(),
    passport = require("passport"),
    async   = require("async"),
    nodeMailer = require("nodemailer"),
    crypto  = require("crypto"),
    Campground = require("../models/campground"),
    User  = require("../models/user"),
    multer = require("multer"),
    request = require('request'),
    middleware = require("../middleware");
    
const userFieldSet = 'name, link, is_verified, picture';
const pageFieldSet = 'name, category, link, picture, is_verified';
    
var smtpTransport = nodeMailer.createTransport({
               service: "Gmail",
               auth: {
                       user: "patiparnair@gmail.com",
                       pass: "15111994",
               }
            });

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: "dlaelxhbp", 
  api_key: "492524649579695", 
  api_secret: "c1hU9DtqLmmPHsvn0k6kqZBrZKc"
});

//LANDING - first page
router.get("/", function(req,res){
    res.send("HELLO WORLD");
});

//REGISTER - show form to create new user
router.get("/register", function(req, res){
    res.render("register");
});

//SIGNUP - add new user to db
router.post("/register", upload.single("image"), function(req, res){
    cloudinary.uploader.upload(req.file.path, function(result) {
        var avatar = result.secure_url;
        var newUser = new User({
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            avatar: avatar
        });
        if(req.body.adminCode === "amnotgonnatellu"){
            newUser.isAdmin = true;
        };
        User.register(newUser, req.body.password, function(err,user){
            if(err){
                req.flash("error", err.message);
                return res.render("register");
            }
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Successfully, Sign Up! Nice to meet you " + user.username);
                res.redirect("/campgrounds");
            });
        });
    });
});

//LOGIN - show form to sign in
router.get("/login", function(req, res){
   res.render("login"); 
});

router.get('/auth/facebook', passport.authenticate('facebook', {
    failureRedirect: '/login',
    scope:['email']
}));
router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req,res){
        cloudinary.uploader.upload("https://graph.facebook.com/"+req.user.id+"/picture?type=large", function(result) {
            var avatar = result.secure_url;
            var newUser = {
                firstname: req.user._json.first_name,
                lastname: req.user._json.last_name,
                email: req.user._json.email,
                avatar: avatar,
                publicId: result.public_id
            };
            res.render("fbLogin", {user: newUser})
        });
    }
);

router.post("/fbRegister", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        avatar: req.body.image
    });
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            req.logout();
            req.flash("error", err.message);
            cloudinary.v2.uploader.destroy(req.body.publicId, 
                function(error, result) {console.log(result) });
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Successfully, Sign Up! Nice to meet you " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//SIGNIN - matching data and user db
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        successFlash: "Successfully, LOG IN!!!",
        failureFlash: true
    }), function(req, res){
});

//LOGOUT - sign out
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "LOG YOU OUT!")
   res.redirect("/campgrounds");
});

//FORGOT PASSWORD
router.get("/forgot", function(req, res){
    res.render("forgot");
});

router.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done){
           crypto.randomBytes(20, function(err, buff){
               var token = buff.toString("hex");
               done(err, token);
           }); 
        },
        function(token, done){
            User.findOne({ email: req.body.email }, function(err, user){
                if(!user){
                    req.flash("error", "No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                user.save(function(err){
                   done(err, token, user); 
                });
            });
        },
        function(token, user, done){
            var mailOptions = {
                to: user.email,
                from: "patiparnair@gmail.com",
                subject: "YelpCamp Password Reset",
                text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                    "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                    "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                    "If you did not request this, please ignore this email and your password will remain unchanged.\n"
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log("mail sent");
                req.flash("success", "An email have been sent to " + user.email + " with further instuctions.");
                done(err, "done");
            });
        }
    ], function(err){
      if(err) return next(err);
      res.redirect("/forgot");
    });
});

router.get("/reset/:token", function(req, res){
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
        if(!user){
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        res.render("reset", { token: req.params.token });
    });
});

router.post("/reset/:token", function(req, res){
    async.waterfall([
        function(done){
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
                if(!user){
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, function(err){
                       user.resetPasswordToken = undefined;
                       user.resetPasswordExpires = undefined;
                       user.save(function(err){
                          req.logIn(user, function(err){
                              done(err, user);
                          });
                       });
                    });
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect("back");
                }
            });
        },
        function(user, done){
            var mailOptions = {
                to: user.email,
                from: "patiparnair@gmail.com",
                subject: "Your password have been changed",
                text: "Hello,\n\n" +
                    "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
            };
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash("success", "Successfully changed your password!!!");
                done(err);
            });
        }
    ], function(err){
        res.redirect("/campgrounds");
    });
});

//USER PROFILE - show information of user
router.get("/users/:authorId", function(req, res){
    User.findById(req.params.authorId, function(err, currentlyUser){
        if(err){
            req.flash("error", "DONT MESS WITH MY SITE");
            res.redirect("back");
        };
        Campground.find().where("author.id").equals(currentlyUser._id).exec(function(err, campgrounds){
            if(err){
            req.flash("error", "DONT MESS WITH MY SITE");
            res.redirect("back");
        };
          res.render("users/show", {user: currentlyUser, campgrounds: campgrounds});
        });
    });
});

module.exports = router;