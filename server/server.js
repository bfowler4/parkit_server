const express = require(`express`);
const passport = require(`passport`);
const bodyParser = require(`body-parser`);
const path = require(`path`);
const app = express();

const apiRoute = require(`./api`);

const secret = require(`../config`).passport.secret;
const PORT = process.env.PORT || 8080;
 
app.use(express.static(`public`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(passport.initialize());

app.use(`/api`, apiRoute);

app.use((err, req, res, next) => {
  if (err.name === `UnauthorizedError`) {
    res.status(401).send(`Invalid token`);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});