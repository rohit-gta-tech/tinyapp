const express = require("express");
const app = express();
app.set("view engine", "ejs");
const PORT = 8080; // default port 8080

//original database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Middleware to make BUFFER data readable to humans
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

//GET route to render the new urls_new templatte
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//GET call to show a particular URL and its short name by passing its short name as request parameter
app.get("/urls/:shortURL", (req,res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
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

//Server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// POST route for deleting URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//funciton for generating random alphanumeric string of 6 characters
const generateRandomString = () => {
  let range = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += range[Math.floor(Math.random() * 62)];
  }
  return id;
};