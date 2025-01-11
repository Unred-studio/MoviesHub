import { useState, useEffect } from 'react';
import fetchPopularMovies from '../server/api.js';

function App() {
  const [movies, setMovies] = useState([]);
  const [suggestedMovies, setSuggestedMovies] = useState([movies.slice(0, 10)]);
  const [untouchedMovies, setUntouchedMovies] = useState([]);
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
          setMovies((prevMovies) => [...prevMovies, ...additional_movies]);
        }
      }
      catch (err) {

        console.log("Error while fetching movies data with dependency", err)
      }
    })
  }, [movies, likedMovies, dislikedMovies])


  const handleLikeMovie = (movie) => {
    setLikedMovies((prevLikedMovies) => [...prevLikedMovies, movie]);
    handleNextSuggestion(movie);
  };

  const handleDislikeMovie = (movie) => {
    setDislikedMovies((prevDislikedMovies) => [...prevDislikedMovies, movie]);
    handleNextSuggestion(movie);
  };

  useEffect(() => {
    setUntouchedMovies(movies.filter(
      (movie) => 
      !suggestedMovies.includes(movie) && 
      !likedMovies.includes(movie) && 
      !dislikedMovies.includes(movie)
    ));
  }, [movies, suggestedMovies, likedMovies, dislikedMovies]);

  const sortArrayByFrequency = (arr) => {
    const frequencyMap = arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  
    return Object.keys(frequencyMap).sort((a, b) => frequencyMap[b] - frequencyMap[a]);
  };

  const handleNextSuggestion = (movie) => {

    const likedGenres = sortArrayByFrequency(likedMovies.map((movie) => movie.genre_ids).flat());

    const dislikedGenres = sortArrayByFrequency(dislikedMovies.map((movie) => movie.genre_ids).flat());

    const likedDirectors = sortArrayByFrequency(likedMovies.map((movie) => movie.director).flat());
    const dislikedDirectors = sortArrayByFrequency(dislikedMovies.map((movie) => movie.director).flat());

    const likedActors = sortArrayByFrequency(likedMovies.map((movie) => movie.actors).flat());
    const dislikedActors = sortArrayByFrequency(dislikedMovies.map((movie) => movie.actors).flat());

    
    
    setSuggestedMovies((prevSuggestedMovies) => {
      const index = prevSuggestedMovies.indexOf(movie); // Find the movie's index
      if (index !== -1) {
        const nextMovie = untouchedMovies[0]; // Get the next movie from untouchedMovies
        if (nextMovie) {
          const updatedSuggestions = [...prevSuggestedMovies];
          updatedSuggestions[index] = nextMovie; // Replace the movie at the found index
          return updatedSuggestions;
        }
      }
      return prevSuggestedMovies;
    });
  };



  return (
    <>
      {suggestedMovies.map((movie) => (
        //harleen code here
        <div key={movie.id}>{movie.title}</div>
      ))}
    </>
  );
}

export default App;
