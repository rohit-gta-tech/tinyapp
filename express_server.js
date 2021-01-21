const express = require("express");
const app = express();
app.set("view engine", "ejs");
const PORT = 8080; // default port 8080

//bcrypt module for password hashing
const bcrypt = require('bcrypt');


//Middleware cookie-parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//Middleware to make BUFFER data readable to humans
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//original URL database
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "x2Rpl0" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "x2Rpl0" },
  q2nn9U: { longURL: "https://www.facebook.com", userID: "3RcCfj" },
  we44Mn: { longURL: "https://www.wikipedia.org", userID: "3RcCfj" }
};

//original user database
const users = {};

//rendering homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

//Rendering stringified JSON url-database ----- Ignore it if you want
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//The ever so friendly 'HELLO WORLD' page!
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//GET call to show list or index of all URLs
app.get("/urls", (req,res) => {
  const templateVars = {urls: urlsForUser(urlDatabase, req.cookies['user_id']), user: users[req.cookies['user_id']]};
  res.render("urls_index", templateVars);
});

//GET route to render the new urls_new template
app.get("/urls/new", (req, res) => {
  if(!req.cookies['user_id']) {
    res.redirect("/login")
  }
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render("urls_new", templateVars);
});

//GET call to show a particular URL and its short name by passing its short name as request parameter
app.get("/urls/:shortURL", (req,res) => {
  //Check to find it the shortURL paramater is a key of or belongs to the filetered database of the respective user
  if (urlsForUser(urlDatabase, req.cookies['user_id']).hasOwnProperty(req.params.shortURL)) {
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies['user_id']]};
    res.render("urls_show", templateVars);
  } else {
    res.status(400);
    res.send("Not a valid tinyURL! Or user not logged in!")
  }
});

//POST route for submitting forms through urls/new, since the action attribute of the forms in /urls/new is set to /urls
app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let newId = generateRandomString();
  urlDatabase[newId] = {longURL: req.body.longURL, userID: req.cookies['user_id']};     //adds the new URL to our urlDatabase object
  //console.log(urlDatabase);  //Log the updated urlDatabase object in the terminal
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
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
  if (urlsForUser(urlDatabase, req.cookies['user_id']).hasOwnProperty(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//POST route for updating URLs
app.post("/urls/:shortURL/update", (req, res) => {
  if (urlsForUser(urlDatabase, req.cookies['user_id']).hasOwnProperty(req.params.shortURL))
  urlDatabase[req.params.shortURL] = { longURL: req.body.longURL, userID: req.cookies['user_id'] }
  res.redirect(`/urls/${req.params.shortURL}`);
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

  res.cookie('user_id', user.id);
  res.redirect('/urls');
  
});

//POST route for logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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
    res.cookie('user_id', newUser.id);
    console.log(users);
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

//functon for generating random alphanumeric string of 6 characters
const generateRandomString = () => {
  let range = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += range[Math.floor(Math.random() * 62)];
  }
  return id;
};


//Helper function to check if user already exists and retrieving the user through emailId
const getUserByEmail = (userDb, email) => {
  for(let user in userDb) {
    if (userDb[user].email === email) {
      return userDb[user];
    }
  }
  return false;
}

//filtering urldatabase based on userid

const urlsForUser = function(database, uid) {
  let filteredKeys = Object.keys(database).filter(element => database[element].userID === uid);
  let filteredDatabase = {};
  for (let key of filteredKeys) {
    filteredDatabase[key] = database[key];
  }
  return filteredDatabase;
}