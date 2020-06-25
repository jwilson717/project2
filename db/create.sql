DELETE FROM accounts;
DELETE FROM rating;
DELETE FROM movies;
DELETE FROM genres;
DELETE FROM movie_has_genre;
DROP TABLE movie_has_genre;
DROP TABLE genres;
DROP TABLE movies;
DROP TABLE rating;
DROP TABLE accounts;

CREATE TABLE accounts (
   account_id SERIAL PRIMARY KEY
   , fname VARCHAR(45) NOT NULL 
   , lname VARCHAR(45) NOT NULL 
   , email VARCHAR(75) NOT NULL 
   , username VARCHAR(45) NOT NULL 
   , password VARCHAR(60) NOT NULL
); 

CREATE TABLE rating (
   rating_id SERIAL PRIMARY KEY 
   , rating VARCHAR(8)
);

CREATE TABLE movies (
   movie_id SERIAL PRIMARY KEY 
   , title VARCHAR(75) NOT NULL 
   , rating_id INT NOT NULL 
   , description VARCHAR(255) 
   , FOREIGN KEY (rating_id) REFERENCES rating(rating_id) 
);

CREATE TABLE genres (
   genre_id SERIAL PRIMARY KEY 
   , genre VARCHAR(45)
);

CREATE TABLE movie_has_genre (
   movie_has_genre_id SERIAL PRIMARY KEY 
   , movie_id INT NOT NULL 
   , genre_id INT NOT NULL
);