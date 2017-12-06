var express = require("express"),
    router  = express.Router(),
    passport = require("passport"),
    Campground = require("../models/campground"),
    User  = require("../models/user"),
    middleware = require("../middleware");

//LANDING - first page
router.get("/", function(req,res){
    res.send("Hello");
});

//REGISTER - show form to create new user
router.get("/register", function(req, res){
    res.render("register");
});

//SIGNUP - add new user to db
router.post("/register",function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        avatar: req.body.avatar
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

//LOGIN - show form to sign in
router.get("/login", function(req, res){
   res.render("login"); 
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