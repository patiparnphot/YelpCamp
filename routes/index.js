var express = require("express"),
    router  = express.Router(),
    passport = require("passport"),
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
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Successfully, Sign Up! Nice to meet you" + user.username);
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
        failureRedirect: "/login"
    }), function(req, res){
});

//LOGOUT - sign out
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "LOG YOU OUT!")
   res.redirect("/campgrounds");
});

module.exports = router;