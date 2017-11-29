var express = require("express"),
    router  = express.Router(),
    Campground = require("../models/campground");

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        res.render("campgrounds/index",{campgrounds:allCampgrounds});
    });
});

//NEW - show form to create new campground
router.get("/new",function(req,res){
   res.render("campgrounds/new"); 
});

//CREATE - add new campground to db
router.post("/",function(req,res){
   Campground.create(req.body.newCamp, function(err, newlyCamp){
       newlyCamp.save();
       console.log(newlyCamp);
       res.redirect('/campgrounds');
   });
});

module.exports = router;