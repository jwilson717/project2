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
      client.query("SELECT DISTINCT m.movie_id, m.title, r.rating, m.description FROM movies m INNER JOIN rating r ON m.rating_id = r.rating_id LEFT JOIN movie_has_genre mg ON m.movie_id = mg.movie_id LEFT JOIN genres g ON g.genre_id = mg.genre_id INNER JOIN accounts a ON a.account_id = m.account_id WHERE a.username = $1 AND (UPPER(m.title) LIKE UPPER($2) OR UPPER(g.genre) LIKE UPPER($2) OR UPPER(m.description) LIKE UPPER($2))", [req.body.username, '%' + req.body.search + '%'], function (err, response){
         done();
         if (err) {
            console.log(err.stack);
            res.send('Error Occured');
         } else {
            // console.log(response);
            res.send(JSON.stringify(response.rows));
         }
      });
   });
});

app.get('/login', function (req, res){
   if (req.session.username) {
      res.redirect('/dashboard');
   } else {
      res.render('login');
   }
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

app.post('/addMovie', function(req, res) {
   console.log(req.body);
   pool.connect(function (err, client, done) {
      if (err) {
         console.log(err.stack);
      }

      client.query("INSERT INTO movies (title, year, rating_id, description, account_id) VALUES ($1, $2, (SELECT rating_id FROM rating WHERE rating = $3),$4, (SELECT account_id FROM accounts WHERE username = $5))", [req.body.title, req.body.year, req.body.rating, req.body.description, req.session.username], function (err, response) {
         if (err) {
            res.json({success: false, msg: 'Error adding movie'});
         } else {
            if(req.body.genres) {
               req.body.genres.forEach(genre => {
                  client.query("INSERT INTO movie_has_genre (movie_id, genre_id) VALUES (currval('movies_movie_id_seq'), (SELECT genre_id FROM genres WHERE genre = $1))", [genre], function (err, result) {
                     if (err) {
                        res.json({success: false, msg: 'Genres not correctly added'});
                     } else {
                        res.json({success: true, msg: 'Movie added successfully!'});
                     }
                  });
               });
               done();
            } else {
               done();
               res.json({success: true, msg: 'Movie added successfully!'});
            }
         }
      });
   });
});

app.post('/logout', function (req, res) {
   if(req.session.username) {
      req.session.destroy();
      res.json({success: true, msg:'Successfully logged out'});
   } else {
      res.json({success:false, msg: 'Error logging out'});
   }
});

app.post('/details', function (req, res) {
   pool.connect(function (err, client, done) {
      if(err) throw err;
      client.query("SELECT DISTINCT m.movie_id, m.title, r.rating, m.description, g.genre FROM movies m INNER JOIN rating r ON m.rating_id = r.rating_id LEFT JOIN movie_has_genre mg ON m.movie_id = mg.movie_id LEFT JOIN genres g ON g.genre_id = mg.genre_id INNER JOIN accounts a ON a.account_id = m.account_id WHERE m.movie_id = $1", [req.body.id], function (err, response){
         done();
         if (err) {
            console.log(err.stack);
            res.send('Error Occured');
         } else {
            console.log(response);
            res.json(response.rows);
         }
      });
   });
});

app.listen(PORT);
console.log(`Listening on port ${PORT}`);

