//Helper function to check if user already exists and retrieving the user through emailId

const getUserByEmail = (userDb, email) => {
    for(let user in userDb) {
      if (userDb[user].email === email) {
        return userDb[user];
      }
    }
    return false;
  }
  
//filtering urldatabase based on user_id of a user
  
const urlsForUser = function(database, uid) {
    let filteredKeys = Object.keys(database).filter(element => database[element].userID === uid);
    let filteredDatabase = {};
    for (let key of filteredKeys) {
      filteredDatabase[key] = database[key];
    }
    return filteredDatabase;
}

//function for generating random alphanumeric string of 6 characters

const generateRandomString = () => {
    let range = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += range[Math.floor(Math.random() * 62)];
    }
    return id;
};

module.exports = {getUserByEmail, urlsForUser, generateRandomString};
