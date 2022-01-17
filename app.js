require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session')
const passport = require('passport')
const passportMongoose = require('passport-local-mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));


//MongoDB connection
mongoose.connect("mongodb://localhost:27017/userdb", {
    useNewUrlParser: true
});
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String
});

// console.log(process.env.SECRET);
// const secret = "Thisisourlittlesecret.";
// userSchema.plugin(encrypt, {
//     secret: process.env.SECRET,
//     encryptedFields: ["password"]
// });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//This plugin must be added before the model section
//because model is going to use that plugin which is encrypted
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const User = new mongoose.model("User", userSchema);

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

//TODO
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.render("secrets");
  });

app.get("/", function (req, res) {
    res.render("home");
})
app.get("/login", function (req, res) {
    res.render("login");
})
app.post("/login", function (req, res) {
    const email = req.body.username;
    const password = req.body.password;
    User.findOne({
        email: email
    }, function (err, foundUser) {
        if (!err) {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result){
                    if(result){
                        res.render("secrets");
                    }else{
                        res.send("Wrong Password!!");
                    }
                })
            }
        } else {
            res.send(err)
        }
    })
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const user = new User({
            email: req.body.username,
            password: hash
        })
        user.save(function (err) {
            if (!err) {
                res.render("secrets");
            } else {
                res.send(err)
            }
        })
    });
})
app.listen(3000, function () {
    console.log("Server started on port 3000");
});