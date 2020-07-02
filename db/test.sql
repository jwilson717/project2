SELECT DISTINCT m.title
, r.rating
, m.description 
FROM movies m INNER JOIN rating r 
   ON m.rating_id = r.rating_id LEFT JOIN movie_has_genre mg 
   ON m.movie_id = mg.movie_id LEFT JOIN genres g 
   ON g.genre_id = mg.genre_id INNER JOIN accounts a 
   ON m.account_id = a.account_id
WHERE a.username = 'Test'
AND (UPPER(m.title) LIKE UPPER('%iron%') OR UPPER(g.genre) LIKE UPPER('%Iron%') OR UPPER(m.description) LIKE UPPER('%iron%'));



