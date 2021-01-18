const express = require("express");
const app = express();
app.set("view engine", "ejs");
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//GET call to show list or index of all URLs
app.get("/urls", (req,res) => {
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

//GET call to show a particular URL and its short name by passing its short name as request parameter
app.get("/urls/:shortURL", (req,res) => {
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]}
    res.render("urls_show", templateVars);
  });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});