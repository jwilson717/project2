const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;
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
   pool.connect(function (err, client, done){
      if(err) throw err;
      client.query('INSERT INTO accounts (fname, lname, email, username, password) VALUES ($1, $2, $3, $4, $5)', [req.body.fname, req.body.lname, req.body.email, req.body.username, req.body.password], function (err, response) {
         done();
         if(err) {
            res.send('Error Adding Account');
         } else {
            res.redirect('dashboard');
         }
      });
   });
});

app.get('/dashboard', function (req, res) {
   res.render('dashboard', {query: req.query});
});

app.listen(PORT);
console.log(`Listening on port ${PORT}`);