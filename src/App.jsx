import { useState, useEffect } from 'react';
import fetchPopularMovies from '../server/api.js';

function App() {
  const [movies, setMovies] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const fetchedMovies = await fetchPopularMovies(0, 5);
        setMovies(fetchedMovies);
      } catch (error) {
        console.error("Error fetching popular movies:", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const threshold = movies.length() - (likedMovies.length() + dislikedMovies.length())
        if (threshold < 10) {
          const additional_movies =  fetchPopularMovies(movies.length()/20, movies.length()/20 + 5);
          setMovies.push(...additional_movies);
        }
      }
      catch (err) {
        
        console.log("Error while fetching movies data with dependency", err)
      }
    })
  }, [movies, likedMovies, dislikedMovies])

  return (
    <>

    </>
  );
}

export default App;
