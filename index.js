const express = require('express');
const body = require('body-parser');
const PORT = process.env.PORT || 8080;
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());

app.listen(PORT);
console.log(`Listening on port ${PORT}`);