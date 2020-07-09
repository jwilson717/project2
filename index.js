const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});
var session = require('express-session');

var app = express();

app.use(session({
   secret: 'secret-secrets'
   , resave: false
   , saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());

app.get('/newaccount', function (req, res) {
   res.render('newaccount', {query: req.query});
});

app.post('/newaccount', function (req, res) {
   bcrypt.hash(req.body.password, 10, (err, hash)=> {
      if (err) {
         console.log(err);
         return;
      }
      pool.connect(function (err, client, done){
         if(err) throw err;
         client.query('INSERT INTO accounts (fname, lname, email, username, password) VALUES ($1, $2, $3, $4, $5)', [req.body.fname, req.body.lname, req.body.email, req.body.username, hash], function (err, response) {
            done();
            if(err) {
              result = {success: false, message: 'Error Creating Account'};
            } else {
               result = {success: true, message: 'dashboard'};
               req.session.username = req.body.username;
            }
            res.json(result);
         });
      });
   });
});

app.get('/dashboard', function (req, res) {
   if (req.session.username) {
      pool.connect(function (err, client, done) {
         if (err) {
            console.log(err.stack);
            return;
         } else {
            client.query("SELECT genre FROM genres", function (err, response) {
               done();
               if (err) {
                  res.render('dashboard', {user: req.session.username, genres: ''});
               } else {
                  result =  response.rows;
                  res.render('dashboard', {user: req.session.username, genres: result});
               }
            });
         }
      });
   } else {
      res.render('login');
   }
});

app.post('/search', function (req, res) {
   pool.connect(function (err, client, done) {
      if(err) throw err;
      client.query("SELECT DISTINCT m.title, r.rating, m.description FROM movies m INNER JOIN rating r ON m.rating_id = r.rating_id LEFT JOIN movie_has_genre mg ON m.movie_id = mg.movie_id LEFT JOIN genres g ON g.genre_id = mg.genre_id INNER JOIN accounts a ON a.account_id = m.account_id WHERE a.username = $1 AND (UPPER(m.title) LIKE UPPER($2) OR UPPER(g.genre) LIKE UPPER($2) OR UPPER(m.description) LIKE UPPER($2))", [req.body.username, '%' + req.body.search + '%'], function (err, response){
         done();
         if (err) {
            console.log(err.stack);
            res.send('Error Occured');
         } else {
            console.log(response);
            res.send(JSON.stringify(response.rows));
         }
      });
   });
});

app.get('/login', function (req, res){
   res.render('login');
});

app.post('/login', function (req, res){
   bcrypt.hash(req.body.password, 10, (err, hash)=> {
      if (err) {
         console.log(err);
         return;
      }
      pool.connect(function (err, client, done) {
         if(err) throw err;
         client.query("SELECT password FROM accounts WHERE username = $1", [req.body.username], function (err, response){
            done();
            if (err) {
               console.log(err.stack);
               res.json({status: 'Error', msg: 'Error Logging In'});
            } else if (response.rows[0]){
               let results = response.rows[0];
               bcrypt.compare(req.body.password, results.password, function (err, auth) {
                  if (auth == true) {
                     result = {success: true, msg: 'Login Succeeded'};
                     req.session.username = req.body.username;
                  } else {
                     result = {success: false, msg: 'Incorrect Password'};
                  }
                  res.json(result);
               });
            } else {
               res.json({success: false, msg: 'Incorrect Username'});
            }
         });
      });
   });
});

app.post('/genres', getGenres);

app.listen(PORT);
console.log(`Listening on port ${PORT}`);

function getGenres(req, res) {
   let result;
   pool.connect(function (err, client, done) {
      if (err) {
         console.log(err.stack);
         return;
      } else {
         client.query("SELECT genre FROM genres", function (err, response) {
            done();
            if (err) {
               return 'none';
            } else {
               result =  response.rows;
               res.json(result);
            }
         });
      }
   });
}