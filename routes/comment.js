var express = require("express"),
    router  = express.Router({mergeParams: true}),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    middleware = require("../middleware");

//NEW - show form to create a new comment
router.get("/new", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            req.flash("error", "DONT MESS WITH MY SITE");
            res.redirect("back");
        }
       res.render("comments/new", {campground: campground}) 
    });
});

//CREATE - add a new comment to db
router.post("/", middleware.isLoggedIn, function(req, res){
   Campground.findById(req.params.id, function(err, campground){
       if(err){
            req.flash("error", "DONT MESS WITH MY SITE");
            res.redirect("back");
        }
      Comment.create(req.body.comment, function(err, comment){
          if(err){
            req.flash("error", "CANNOT ADD NEW COMMENT");
            res.redirect("back");
          }
         comment.author.id = req.user._id;
         comment.author.username = req.user.username;
         comment.save();
         campground.comments.push(comment);
         campground.save();
         req.flash("success", "Successfully add your comment");
         res.redirect("/campgrounds/" + campground._id);
      });
   });
});

//EDIT - show form to edit a comment
router.get("/:commentId/edit", middleware.checkUserComment, function(req, res){
    Comment.findById(req.params.commentId, function(err, comment){
        if(err){
            req.flash("error", "DONT MESS WITH MY SITE");
            res.redirect("back");
        }
        res.render("comments/edit", {campground_id: req.params.id, comment: comment}); 
    });
});

//UPDATE - edit a comment in db
router.put("/:commentId", middleware.checkUserComment, function(req, res){
    Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
        if(err){
            req.flash("error", "DONT MESS WITH MY SITE");
            res.redirect("back");
        }
        req.flash("success", "Successfully edit your comment")
        res.redirect("/campgrounds/" + req.params.id);
    });
});

//DESTROY - delete a campground from db
router.delete("/:commentId", middleware.checkUserComment, function(req, res){
    Comment.findByIdAndRemove(req.params.commentId, function(err){
        if(err){
            req.flash("error", "DONT MESS WITH MY SITE");
            res.redirect("back");
        }
        req.flash("success", "Successfully remove your comment");
        res.redirect("/campgrounds/" + req.params.id);
    });
});

module.exports = router;