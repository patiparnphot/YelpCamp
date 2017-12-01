var express = require("express"),
    router  = express.Router(),
    Campground = require("../models/campground");

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        res.render("campgrounds/index",{campgrounds: allCampgrounds});
    });
});

//NEW - show form to create new campground
router.get("/new", function(req,res){
   res.render("campgrounds/new"); 
});

//CREATE - add new campground to db
router.post("/", function(req,res){
   Campground.create(req.body.newCamp, function(err, newlyCamp){
       newlyCamp.save();
       console.log(newlyCamp);
       res.redirect("/campgrounds");
   });
});

//SHOW - show more info about one campground
router.get("/:id", function(req,res){
   Campground.findById(req.params.id, function(err, currentlyCamp){
      res.render("campgrounds/show", {campground: currentlyCamp}); 
   });
});

//EDIT - show form to edit campground
router.get("/:id/edit", function(req,res){
    Campground.findById(req.params.id, function(err, currentlyCamp){
      res.render("campgrounds/edit", {campground: currentlyCamp}); 
   });
});

//UPDATE - edit campground in db
router.put("/:id", function(req,res){
   Campground.findByIdAndUpdate(req.params.id, {$set: req.body.editData}, function(err,campground){
      res.redirect("/campgrounds/" + campground._id); 
   });
});

//DESTROY - delete campground from db
router.delete("/:id", function(req,res){
   Campground.findByIdAndRemove(req.params.id, function(err){
      res.redirect("/campgrounds");
   });
});

module.exports = router;