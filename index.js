const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

var app = express();

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
              res.send(JSON.stringify({status: 'Error', message: 'Error Creating Account'}));
            } else {
               res.send(JSON.stringify({status: 'Success', message: 'dashboard', username: req.body.username}));
            }
         });
      });
   });
});

app.post('/dashboard', function (req, res) {
   res.render('dashboard', {body: req.body});
});

app.post('/search', function (req, res) {
   pool.connect(function (err, client, done) {
      if(err) throw err;
      client.query("SELECT DISTINCT m.title, r.rating, m.description FROM movies m INNER JOIN rating r ON m.rating_id = r.rating_id LEFT JOIN movie_has_genre mg ON m.movie_id = mg.movie_id LEFT JOIN genres g ON g.genre_id = mg.genre_id INNER JOIN accounts a ON a.account_id = m.account_id WHERE a.username = $1 AND (UPPER(m.title) LIKE UPPER($2) OR UPPER(g.genre) LIKE UPPER($2) OR UPPER(m.description) LIKE UPPER($2))", [req.body.username, `%${req.body.search}%`], function (err, response){
         done();
         if (err) {
            console.log(err.stack);
            res.send('Error');
         } else {
            console.log(response);
            res.send(response.rows);
         }
      });
   });
});

app.listen(PORT);
console.log(`Listening on port ${PORT}`);
