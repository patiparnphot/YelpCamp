//SETUP NPM
var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    FacebookStrategy= require("passport-facebook").Strategy,
    flash           = require("connect-flash"),
    session         = require("express-session"),
    methodOverride  = require("method-override"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    User        = require("./models/user");

    
//requiring routes
var commentRoutes    = require("./routes/comment"),
    campgroundRoutes = require("./routes/campground"),
    indexRoutes      = require("./routes/index");
    
//SETUP GENERAL

mongoose.connect("mongodb://localhost/yelp_camp");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "It is me",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.locals.moment = require("moment");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(function(user, done){ done(null, user) });
passport.deserializeUser(function(user, done){ done(null, user) });
passport.use(new FacebookStrategy({
    clientID: "2030077057205209",
    clientSecret: "2ef9bf727225c99d4df0fe738fe997b6",
    callbackURL: "https://myportfolio-bukunjom.c9users.io/auth/facebook/callback",
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified']
  },
  function(accessToken, refreshToken, profile, done){
      profile.accessToken = accessToken;
      done(null, profile)
  }
));

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.get("/google151fffa848e804ed.html", function(req, res){
   res.send("google-site-verification: google151fffa848e804ed.html"); 
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started!");
});