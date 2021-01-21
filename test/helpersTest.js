const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail(testUsers, "user2@example.com")
    const expectedOutput = {
        id: "user2RandomID", 
        email: "user2@example.com", 
        password: "dishwasher-funk"
      }
    // Write your assert statement here
    assert.deepEqual(user, expectedOutput)
  });
  it('should return undefined if email is not found in database', function() {
    const user = getUserByEmail(testUsers, "qaa@example.com")
    // Write your assert statement here
    assert.equal(user, false)
  });
});


