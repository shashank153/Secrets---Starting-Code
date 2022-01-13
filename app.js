require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

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
    password: String
});

// console.log(process.env.SECRET);
// const secret = "Thisisourlittlesecret.";
userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ["password"]
});
//This plugin must be added before the model section
//because model is going to use that plugin which is encrypted

const User = new mongoose.model("User", userSchema);

//TODO
app.get("/", function (req, res) {
    res.render("home");
})
app.get("/login", function (req, res) {
    res.render("login");
})
app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({
        username: username
    }, function (err, foundUser) {
        if (!err) {
            console.log(process.env.SECRET);
            if (foundUser) {
                console.log(foundUser);
                if (foundUser.password === password) {
                    res.render("secrets");
                } else {
                    res.send("Entered password is incorrect!!");
                }
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
    const user = new User({
        email: req.body.username,
        password: req.body.password
    })
    user.save(function (err) {
        if (!err) {
            res.render("secrets");
        } else {
            res.send(err)
        }
    });
})
app.listen(3000, function () {
    console.log("Server started on port 3000");
});