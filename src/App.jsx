import { useState, useEffect } from 'react';
import fetchPopularMovies from '../server/api.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  const [movies, setMovies] = useState([]);
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  const [untouchedMovies, setUntouchedMovies] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);

  // Fetch movies and populate initial suggestions
  useEffect(() => {
    (async () => {
      try {
        const fetchedMovies = await fetchPopularMovies(0, 5);
        setMovies(fetchedMovies);

        // Initialize suggestedMovies only if it's empty
        if (suggestedMovies.length === 0) {
          setSuggestedMovies(fetchedMovies.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching popular movies:", error);
      }
    })();
  }, []); // No dependency on `movies` to avoid resetting suggestedMovies

  // Fetch additional movies when the threshold decreases
  useEffect(() => {
    (async () => {
      try {
        const threshold = movies.length - (likedMovies.length + dislikedMovies.length);
        if (threshold < 10) {
          const additionalMovies = await fetchPopularMovies(movies.length / 20, movies.length / 20 + 5);
          setMovies((prevMovies) => [...prevMovies, ...additionalMovies]);
        }
      } catch (err) {
        console.error("Error while fetching additional movies:", err);
      }
    })();
  }, [movies, likedMovies, dislikedMovies]);

  // Update untouchedMovies when related states change
  useEffect(() => {
    setUntouchedMovies(
      movies.filter(
        (movie) =>
          !suggestedMovies.includes(movie) &&
          !likedMovies.includes(movie) &&
          !dislikedMovies.includes(movie)
      )
    );
  }, [movies, suggestedMovies, likedMovies, dislikedMovies]);

  const handleNextSuggestion = (movie) => {
    setSuggestedMovies((prevSuggestedMovies) => {
      const index = prevSuggestedMovies.indexOf(movie);
      if (index !== -1) {
        const nextMovie = untouchedMovies[0];
        if (nextMovie) {
          const updatedSuggestions = [...prevSuggestedMovies];
          updatedSuggestions[index] = nextMovie;
          return updatedSuggestions;
        }
      }
      return prevSuggestedMovies;
    });
  };

  const handleLikeMovie = (movie) => {
    setLikedMovies((prevLikedMovies) => [...prevLikedMovies, movie]);
    handleNextSuggestion(movie);
  };

  const handleDislikeMovie = (movie) => {
    setDislikedMovies((prevDislikedMovies) => [...prevDislikedMovies, movie]);
    handleNextSuggestion(movie);
  };

  const handleCardClick = (movie) => {
    console.log("Card clicked:", movie); // Replace with modal logic
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)", // 5 columns
        gridAutoRows: "minmax(200px, auto)", // Adjust card height dynamically
        gap: "15px", // Space between cards
        padding: "15px", // Padding around the grid
        margin: "15px", // Margin for spacing from the viewport
        alignItems: "center", // Vertically align grid items
        backgroundColor: "#f8f8f8", // Optional background
        height: "calc(100vh - 30px)", // Ensure it fits within the viewport
        boxSizing: "border-box", // Include padding in size calculations
      }}
    >
      {suggestedMovies.map((movie, index) => (
        <div
          key={movie.id || movie.poster_path || index}
          onClick={() => handleCardClick(movie)} // Handle card click
          style={{
            width: "180px", // Matches the image width
            border: "1px solid #ddd", // Card border
            borderRadius: "6px", // Rounded corners
            overflow: "hidden", // Ensure no overflow
            display: "flex",
            flexDirection: "column", // Stack image and text vertically
            justifyContent: "space-between", // Space out image and text
            textAlign: "center", // Center-align text
            cursor: "pointer", // Make it clickable
            backgroundColor: "#fff", // White background
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow
          }}
        >
          <img
            src={`https://image.tmdb.org/t/p/w300${movie["poster_path"]}`} // Ensure image width matches card
            alt={`${movie.title} Poster`}
            style={{
              width: "100%", // Full width of the card
              height: "180px", // Height for the image
              objectFit: "contain", // Prevent cropping
              backgroundColor: "#f8f8f8", // Neutral background for empty areas
            }}
          />
          <div
            style={{
              padding: "8px", // Padding around the text
              backgroundColor: "#f8f9fa", // Light gray background
              borderTop: "1px solid #ddd", // Divider line
            }}
          >
            <p
              style={{
                margin: 0, // Remove margin
                fontWeight: "bold", // Bold text
                fontSize: "clamp(10px, 2vw, 14px)", // Dynamically resize text
                lineHeight: "1.2", // Adjust line height
                whiteSpace: "nowrap", // Prevent wrapping
                overflow: "hidden", // Hide overflowing text
                textOverflow: "ellipsis", // Add ellipsis for long text
              }}
            >
              {movie.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
