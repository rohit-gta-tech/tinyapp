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

//Middleware cookie-parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

//Middleware cookie-session
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));

//Middleware method override
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//original URL database
const urlDatabase = {};

//original user database
const users = {};

//rendering homepage
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//GET call to show list or index of all URLs
app.get("/urls", (req,res) => {
  const templateVars = {urls: urlsForUser(urlDatabase, req.session.user_id), user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

//GET route to render the new urls_new template
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {user: users[req.session.user_id]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//GET call to show a particular URL and its short name by passing its short name as request parameter
app.get("/urls/:shortURL", (req,res) => {
  if (!req.session.user_id) {
    res.status(400).render("urls_show", {user: null, error: "No such tinyURL exists! Please login or register!"});
  } 
  if (req.session.user_id) {
    if(!urlDatabase[req.params.shortURL]) {
      res.status(400).render("urls_show", {user: users[req.session.user_id], error: "No such TinyURL exists!"});
    } else if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
      const templateVars = { url: urlDatabase[req.params.shortURL], user: users[req.session.user_id], error: null};
      res.render("urls_show", templateVars);
    } else {
      res.status(400).render("urls_show", {user: users[req.session.user_id], error: "You have not created any such short URL!"});
    }
  }
});

// Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    urlDatabase[req.params.shortURL].visits.push({date: new Date(), vid: generateRandomString()})
    const longURL = urlDatabase[req.params.shortURL].longURL;
    if(!req.cookies[req.params.shortURL]) {
      res.cookie(req.params.shortURL, generateRandomString());
      urlDatabase[req.params.shortURL].uniqueVisits++;
    };
    res.redirect(longURL);
  } else {
    res.render("url_errors", {user: users[req.session.user_id], error: "Not a valid tiny URL"});
  }
});

//POST route for submitting forms through urls/new, since the action attribute of the forms in /urls/new is set to /urls
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let newId = generateRandomString();
    urlDatabase[newId] = {shortURL: newId, longURL: req.body.longURL, userID: req.session.user_id, dateCreated: new Date(), visits: [], uniqueVisits: 0};     //adds the new URL to our urlDatabase object
    res.redirect(`/urls/${newId}`);     //Redirected to the newly submitted URL
  } else {
    res.render("url_errors", {user: null, error: "You are not authorized!"});
  }
});

//POST route for updating URLs
app.put("/urls/:shortURL", (req, res) => {
  if (req.session.user_id) {
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      res.redirect('/urls');
    } else {
      res.render("url_errors", {user: req.session.user_id, error: "No such tinyURL!"});
    }
  } else {
    res.render("url_errors", {user: null, error: "You are not authorized!"});
  }
});

// POST route for deleting URLs
app.delete("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id) {
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
    } else {
      res.render("url_errors", {user: req.session.user_id, error: "No such tinyURL!"});
    }
  } else {
    res.render("url_errors", {user: null, error: "You are not authorized!"});
  }
});

//GET route for user login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = {user: null};
    res.render("user_login", templateVars);
  }
});

//GET route for user registration landing page
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = {user: null};
    res.render("user_register", templateVars);
  }
});

//POST route for login
app.post("/login", (req, res) => {
  const incomingEmail = req.body.email;
  const incomingPassword = req.body.password;
  const user = getUserByEmail(users, incomingEmail);

  if(!incomingEmail || !incomingPassword) {
    res.status(403).render("url_errors", {user: null, error: "Please enter both email-id and password to login"});
  } else if (!user) {
    res.status(403).render("url_errors", {user: null, error: "Sorry, it seems you are not registered. Please go to the registration page!"});
  } else if (!bcrypt.compareSync(incomingPassword, user.password)) {
    res.status(403).render("url_errors", {user: null, error: "Sorry, the entered password is incorrect. Please try again!"});
  } else {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

//POST route for user registration
app.post("/register", (req, res) => {
  const incomingEmail = req.body.email;
  const incomingPassword = req.body.password;
  
  //If the e-mail or password are empty strings, send back a response with the 400 status code.
  if (!incomingEmail || !incomingPassword) {
    res.status(400).render("url_errors", {user: null, error: "Sorry, you should enter both email-id and a password to register!"});
  } else if (getUserByEmail(users, incomingEmail)) {
    res.status(400).render("url_errors", {user: null, error: "Sorry, you have already registered! Please login with your email-id"});
  } else {
    const newUser = {
      id: generateRandomString(),
      email: incomingEmail,
      password: bcrypt.hashSync(incomingPassword, 10)
    };
    users[newUser.id] = newUser;
    req.session.user_id = newUser.id;
    res.redirect('/urls');
  }
});

//POST route for logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//Server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




