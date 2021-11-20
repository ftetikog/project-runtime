/*    
  Assignment 2
  Author: Ducarmel Zephyr
  Date: October 23 2021
  Filename: app.js
*/

//installed third party packages
let createError = require("http-errors");
let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");

//Modules for authentification
let session = require("express-session");
let passport = require("passport");
let passportLocal = require("passport-local");
let localStrategy = passportLocal.Strategy;
let flash = require("connect-flash");

//Database setup
let mongoose = require("mongoose");
let dbURI = require("./db");
let jwt = require("jsonwebtoken");

// Connect to the Database
mongoose.connect(dbURI.AtlasDB);

let mongoDB = mongoose.connection;
mongoDB.on("error", console.error.bind(console, "Connection Error:"));
mongoDB.once("open", () => {
  console.log("Connected to MongoDB...");
});

let app = express();

// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../node_modules")));

//Set up express session
app.use(
  session({
    saveUninitialized: true,
    resave: true,
    secret: "sessionSecret",
  })
);

// initialize flash
app.use(flash());

// initialize  passport
app.use(passport.initialize());
app.use(passport.session());

let indexRouter = require("../routes/index");
let incidentRouter = require("../routes/incident");
let authRouter = require("../routes/users");

// passport user configuration
const User = require("../models/user");
const LocalStrategy = require("passport-local").Strategy;
//passport.use(new LocalStrategy(User.authenticate()));
passport.use(User.createStrategy());

//optional but
let compress = require("compression");
let bodyParser = require("body-parser");
let methodOverride = require("method-override");
let cors = require("cors");
let router = express.Router();

let passportJWT = require("passport-jwt");
const { AtlasDB } = require("./db");
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;
//optional but

// serialize and deserialize the User info
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); // verify that the token sent by the user - check if valid

passport.serializeUser(User.serializeUser()); //.serializeUser());
passport.deserializeUser(User.deserializeUser()); //.deserializeUser());

let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJWT.fromAuthHeaderAsBearerToken();
//jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("JWT");
jwtOptions.secretOrKey = dbURI.secret;
let strategy = new JWTStrategy(jwtOptions, (jwt_payload, done) => {
  User.findById(jwt_payload.id)
    .then((user) => {
      return done(null, user);
    })
    .catch((err) => {
      return done(err, false);
    });
});

app.use("/", indexRouter);
app.use("/incident", incidentRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// implement a User Authentication Strategy
passport.use(User.createStrategy());

module.exports = app;
