var express = require("express"),
    router  = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware");

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        res.render("campgrounds",{campgrounds: allCampgrounds});
    });
});

//NEW - show form to create a new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

//CREATE - add a new campground to db
router.post("/", middleware.isLoggedIn, function(req,res){
   Campground.create(req.body.newCamp, function(err, newlyCamp){
       newlyCamp.author.id = req.user._id;
       newlyCamp.author.username = req.user.username;
       newlyCamp.save();
       console.log(newlyCamp);
       req.flash("success", "Successfully added a new campground");
       res.redirect("/campgrounds");
   });
});

//SHOW - show more info about one campground
router.get("/:id", function(req, res){
   Campground.findById(req.params.id).populate("comments").exec(function(err, currentlyCamp){
      res.render("campgrounds/show", {campground: currentlyCamp}); 
   });
});

//EDIT - show form to edit a campground
router.get("/:id/edit", middleware.checkUserCampground, function(req, res){
    Campground.findById(req.params.id, function(err, currentlyCamp){
        res.render("campgrounds/edit", {campground: currentlyCamp});
    });
});

//UPDATE - edit a campground in db
router.put("/:id", middleware.checkUserCampground, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, {$set: req.body.editData}, function(err, campground){
       req.flash("success", "Successfully edit your campground");
       res.redirect("/campgrounds/" + campground._id);
    });
});

//DESTROY - delete a campground from db
router.delete("/:id", middleware.checkUserCampground, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        req.flash("success", "Successfully remove your campground");
        res.redirect("/campgrounds");
    });
});

module.exports = router;