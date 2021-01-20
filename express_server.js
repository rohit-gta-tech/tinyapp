const express = require("express");
const app = express();
app.set("view engine", "ejs");
const PORT = 8080; // default port 8080

//Middleware ccokie-parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//Middleware to make BUFFER data readable to humans
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//original URL database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//original user database
const users = { 
  "x2Rpl0an": {
    id: "x2Rpl0an", 
    email: "John@mydomaon.com", 
    password: "purple-monkey-dinosaur"
  },
 "3RcCfj8y": {
    id: "3RcCfj8y", 
    email: "Mark@yourdomain.com", 
    password: "dishwasher-funk"
  }
}

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
  const templateVars = {urls: urlDatabase, user: users[req.cookies['user_id']]};
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

//GET route to render the new urls_new templatte
app.get("/urls/new", (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render("urls_new", templateVars);
});

//GET call to show a particular URL and its short name by passing its short name as request parameter
app.get("/urls/:shortURL", (req,res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']]};
  res.render("urls_show", templateVars);
});

//POST route for submitting forms through urls/new, since the action attribute of the forms in /urls/new is set to /urls
app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL;     //adds the new URL to our urlDatabase object
  //console.log(urlDatabase);  //Log the updated urlDatabase object in the terminal
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  res.redirect(`/urls/${newId}`);     //Redirected to the newly submitted URL
});

// Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// POST route for deleting URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//POST route for updating URLs
app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

//POST route for login
app.post("/login", (req, res) => {
  const incomingEmail = req.body.email;
  const incomingPassword = req.body.password;

  if(!emailExists(users, incomingEmail)) {
    res.status(403);
    res.send('Sorry, it seems you are not registered. Please go to the registration page');
  }

  if(!idFetcher(users, incomingEmail, incomingPassword)) {
    res.status(403);
    res.send('Sorry, your password is incorrect. Please try again!');
  }
  res.cookie('user_id', idFetcher(users, incomingEmail, incomingPassword));
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
  } else if(emailExists(users, incomingEmail)) {
    res.status(400);
    res.send('Sorry, you have already registered! Please login with your email-id');
  } else {
    //Adding new user to database
    const newUser = {
      id: generateRandomString(),
      email: incomingEmail,
      password: incomingPassword
    }
    users[newUser.id] = newUser;
    console.log(users);
    res.cookie('user_id', newUser.id);
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


//Helper function to check if user already exists
const emailExists = (users, newEmail) => {
  for(let user_id in users) {
    if (users[user_id].email === newEmail) {
      return true;
    }
  }
  return false;
}

//Helper function for password matching and userid fetching if email and password are matching in our database
const idFetcher = (users, email, password) => {
  let id = Object.keys(users).find(element => users[element].email === email);
  if (users[id].password === password) {
    return id;
  } else {
    return false;
  }
};
