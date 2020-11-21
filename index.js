const {nanoid} = require('nanoid');
const { promisify } = require('util');
const redis = require('redis');
const express = require('express');
const jwt = require('jsonwebtoken');

const client = redis.createClient(process.env.REDIS_URL);

client.on("error", (error) => {
  console.error(error);
})

const app = express();

const TIMEOUT = 30;
const SECRET = 'thisistheverysecretstring';


app.post('/login', (req, res) => {
  if(!req.headers.authorization) {
    res.sendStatus(401);
    return;
  }

  const [user, pass] = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');

  client.get(user, (err, data) => {
    if(err || data === null || data !== pass) {
      res.sendStatus(401);
      return;
    }
    let token = jwt.sign({name: user, 
      iss: 'gatekeeper', 
      exp: (new Date().getTime()/1000) + TIMEOUT},
      SECRET);
    res.send({token});
  });
});

app.post('/token', (req, res) => {
  if(!req.headers.authorization) {
    res.sendStatus(401);
    return;
  }
  const token = req.headers.authorization.split(' ')[1];


  jwt.verify(token, SECRET, (err, decoded) => {
    if(err || decoded === undefined) {
      res.sendStatus(401);
      return;
    }

    res.sendStatus(200);
  });

});

app.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});