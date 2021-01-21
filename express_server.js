const express = require("express");
const app = express();
app.set("view engine", "ejs");
const PORT = 8080; // default port 8080

//require helper functions
const {getUserByEmail, urlsForUser, generateRandomString} = require('./helpers');

//bcrypt module for password hashing
const bcrypt = require('bcrypt');

//Middleware to make BUFFER data readable to humans
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Middleware cookie-session
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}))

//original URL database
const urlDatabase = {};

//original user database
const users = {};

//rendering homepage
app.get("/", (req, res) => {
  res.redirect('/urls');
});

//GET call to show list or index of all URLs
app.get("/urls", (req,res) => {
  const templateVars = {urls: urlsForUser(urlDatabase, req.session.user_id), user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

//GET route to render the new urls_new template
app.get("/urls/new", (req, res) => {
  if(!req.session.user_id) {
    res.redirect("/login")
  }
  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_new", templateVars);
});

//GET call to show a particular URL and its short name by passing its short name as request parameter
app.get("/urls/:shortURL", (req,res) => {
  //Check to find it the shortURL paramater is a key of or belongs to the filtered database of the respective user
  if (urlsForUser(urlDatabase, req.session.user_id).hasOwnProperty(req.params.shortURL)) {
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id]};
    res.render("urls_show", templateVars);
  } else {
    res.status(400);
    res.send("Not a valid tinyURL! Or user not logged in!")
  }
});

//POST route for submitting forms through urls/new, since the action attribute of the forms in /urls/new is set to /urls
app.post("/urls", (req, res) => {
    let newId = generateRandomString();
    urlDatabase[newId] = {longURL: req.body.longURL, userID: req.session.user_id};     //adds the new URL to our urlDatabase object
    res.redirect(`/urls/${newId}`);     //Redirected to the newly submitted URL
});

// Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  // to check if the urlforUser data has the key shortURL
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// POST route for deleting URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlsForUser(urlDatabase, req.session.user_id).hasOwnProperty(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//POST route for updating URLs
app.post("/urls/:shortURL/update", (req, res) => {
  if (urlsForUser(urlDatabase, req.session.user_id).hasOwnProperty(req.params.shortURL)) {
    urlDatabase[req.params.shortURL] = { longURL: req.body.longURL, userID: req.session.user_id }
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

//POST route for login
app.post("/login", (req, res) => {
  const incomingEmail = req.body.email;
  const incomingPassword = req.body.password;

  if(!getUserByEmail(users, incomingEmail)) {
    res.status(403);
    res.send('Sorry, it seems you are not registered. Please go to the registration page');
  }

  const user = getUserByEmail(users, incomingEmail);
  if(!bcrypt.compareSync(incomingPassword, user.password)) {
    res.status(403);
    res.send('Sorry, your password is incorrect. Please try again!');
  }

  req.session.user_id = user.id;
  res.redirect('/urls'); 
});

//POST route for logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//GET route for user registration landing page
app.get("/register", (req, res) => {
  const templateVars = {user:""};
  res.render("user_register", templateVars);
});

//POST route for user registration
app.post("/register", (req, res) => {
  const incomingEmail = req.body.email;
  const incomingPassword = req.body.password;
  
  //If the e-mail or password are empty strings, send back a response with the 400 status code.
  if(!incomingEmail || !incomingPassword) {
    res.status(400);
    res.send('Sorry, you should enter both email-id and a password to register!');
  } else if(getUserByEmail(users, incomingEmail)) {
    res.status(400);
    res.send('Sorry, you have already registered! Please login with your email-id');
  } else {
    //Adding new user to database
    const newUser = {
      id: generateRandomString(),
      email: incomingEmail,
      password: bcrypt.hashSync(incomingPassword, 10)
    }
    users[newUser.id] = newUser;
    req.session.user_id = newUser.id;
    res.redirect('/urls');
  }
});

//GET route for user login page
app.get("/login", (req, res) => {
  const templateVars = {user:""};
  res.render("user_login", templateVars);
})

//Server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




