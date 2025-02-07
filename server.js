const express = require("express");
const app = express();
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const MYSECRETJWTKEY = "mysecret";

let users = [];
let high_scores = [];

const optionsForJwtValidation = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: MYSECRETJWTKEY
};

function arrayEquals(a, b) {
  return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}

/*
passport.use(new BasicStrategy(function(username,password,done)
{
  console.log("sign in auth");
  console.log(users);
    for(let u in users) {
        if(users[u].userHandle == username && users[u].password == password) {
            return done(null, {
                username: users[u].userHandle
            });
        }
    }
    return done(null,false);
}))
*/

app.post('/login', (req, res, next) => {
  let keyNames = Object.keys(req.body);
  let allowed = ["userHandle","password"];
  //console.log(typeof req.body.userHandle);
  if(arrayEquals(keyNames,allowed) && req.body.userHandle && req.body.password && (typeof req.body.userHandle === 'string') && (typeof req.body.password === 'string')) {
    for(let u in users) {
      if(users[u].userHandle == req.body.userHandle && users[u].password == req.body.password) {
          return next();
      }
    }
  }
  else {
    return res.status(400).send("Bad request");
  }
  return res.status(401).send("incorrect username or password");
})

app.post('/high-scores',(req,res,next) => {
  const authField = req.get('Authorization');
  if(authField == undefined) {
      //console.log('No auth field in headers');
      res.status(401).send();
      return;
  }

  const bearerCheck = authField.slice(0, 6);
  console.log(bearerCheck);
  if(bearerCheck != "Bearer")
  {
      //console.log('No Bearer in the auth field');
      res.status(401).send('JWT token is missing or invalid');
      return;
  }

  // next extract the token from the authField
  const authStrs = authField.split(' ');
  const token = authStrs[1];
  //console.log('Token value is: ' + token);

  // validate the token
  try {
      const payload = jwt.verify(token, MYSECRETJWTKEY);
      // respond with successfull operation
      return next();
  } catch (error) {
      //console.log('JWT token is missing or invalid')
      res.status(401).send();
  }
})

passport.use(new JwtStrategy(optionsForJwtValidation, function(payload, done) {
    done(null, true);
}));

app.post('/signup',(req, res) => {
    if(req.body.userHandle && req.body.password)
    {
      if((req.body.userHandle.length >= 6) && (req.body.password.length >= 6)) {
        const body = {userHandle:req.body.userHandle, password:req.body.password}
        users.push(body);
        res.status(201).send("User registered succesfully");
      }
      else {
        res.status(400).send("Too short username or password (must be at least 6 characters)");
      }
    }
    else
    {
        res.status(400).send("Invalid request body");
    }
});

app.post('/login',(req,res) => {
    const token = jwt.sign({ username: req.body.userHandle }, MYSECRETJWTKEY);
    res.status(200).json({
        //info: "Login successful, JWT token provided",
        jsonWebToken: token
    });
})

app.post('/high-scores',(req,res) => {
  //console.log("a" + req.body.level);
  //console.log("b" + req.body.userHandle);
  //console.log(req.body.score);
  //console.log(req.body.timestamp);
  if(req.body.hasOwnProperty('level') && req.body.hasOwnProperty('userHandle') && req.body.hasOwnProperty('score') && req.body.hasOwnProperty('timestamp'))
  {
    const body = {level:req.body.level, userHandle:req.body.userHandle, score:req.body.score, timestamp:req.body.timestamp}
    high_scores.push(body);
    res.status(201).send('High score posted successfully');
  }
  else {
    res.status(400).send('Invalid request body');
    console.log("bad request");
    //res.status(200).send('High score posted successfully');
  }
})

app.get('/high-scores',(req,res)=>
{
  responseHighScores = [];
  if(req.query.level) {
    let found = false;
    for(let i in high_scores) {
      if(req.query.level === high_scores[i].level) {
        responseHighScores.push(high_scores[i]);
        found = true;
      }
    }
    if(found) {
      responseHighScores.sort((a, b) => b.score - a.score);
    }
  }
  else {
    res.status(400).send('Invalid request body');
    return;
  }
  let page = 1;
  if(req.query.page) {
    page = req.query.page
  }
  pageHighScores = [];
  for(let i = (page-1)*20; i < page*20; i++) {
    if(i < responseHighScores.length) {
      pageHighScores.push(responseHighScores[i]);
    }
    else {
      break;
    }
  }
  res.status(200).json(pageHighScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
    },
};

//module.exports.start();
