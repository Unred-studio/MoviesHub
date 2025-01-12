import { useState, useEffect, useRef } from "react";
import fetchPopularMovies from '../server/api.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  const modalRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  const [untouchedMovies, setUntouchedMovies] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null); // Initialize selectedMovie here


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
          !suggestedMovies.some((sMovie) => sMovie.id === movie.id) &&
          !likedMovies.some((lMovie) => lMovie.id === movie.id) &&
          !dislikedMovies.some((dMovie) => dMovie.id === movie.id)
      )
    );
  }, [movies, suggestedMovies, likedMovies, dislikedMovies]);

  function sortByFrequency(arr) {
    // Step 1: Create a frequency map
    const frequencyMap = arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  
    // Step 2: Sort the array by frequency and preserve order for elements with the same frequency
    return [...new Set(arr)].sort((a, b) => frequencyMap[b] - frequencyMap[a]);
  }

  const handleNextSuggestion = (movie) => {
    const likedGenre = sortByFrequency(likedMovies.map((m) => m.genres).flat());
    const dislikedGenre = sortByFrequency(dislikedMovies.map((m) => m.genres).flat());
    const likedDirector = sortByFrequency(likedMovies.map((m) => m.director));
    const dislikedDirector = sortByFrequency(dislikedMovies.map((m) => m.director));
    const likedActors = sortByFrequency(likedMovies.map((m) => m.actors).flat());
    const dislikedActors = sortByFrequency(dislikedMovies.map((m) => m.actors).flat());
  
    const scoreMovie = (movie) => {
      let score = 0;
  
      // Increase score for liked genres
      movie.genres.forEach((genre) => {
        if (likedGenre.includes(genre)) {
          score += likedGenre.length - likedGenre.indexOf(genre); // Higher for frequently liked genres
        }
        if (dislikedGenre.includes(genre)) {
          score -= dislikedGenre.length - dislikedGenre.indexOf(genre); // Penalize disliked genres
        }
      });
  
      // Adjust score for director
      if (likedDirector.includes(movie.director)) {
        score += likedDirector.length - likedDirector.indexOf(movie.director);
      }
      if (dislikedDirector.includes(movie.director)) {
        score -= dislikedDirector.length - dislikedDirector.indexOf(movie.director);
      }
  
      // Adjust score for actors
      movie.actors.forEach((actor) => {
        if (likedActors.includes(actor)) {
          score += likedActors.length - likedActors.indexOf(actor);
        }
        if (dislikedActors.includes(actor)) {
          score -= dislikedActors.length - dislikedActors.indexOf(actor);
        }
      });
  
      return score;
    };
  
    setSuggestedMovies((prevSuggestedMovies) => {
      const index = prevSuggestedMovies.findIndex((m) => m.id === movie.id);
  
      if (index !== -1) {
        // Sort untouchedMovies based on scoring logic
        const sortedMovies = untouchedMovies.sort((a, b) => scoreMovie(b) - scoreMovie(a));
        const nextMovie = sortedMovies[0];
  
        if (nextMovie) {
          const updatedSuggestions = [...prevSuggestedMovies];
          updatedSuggestions[index] = nextMovie;
  
          // Remove the selected movie from untouchedMovies
          setUntouchedMovies((prevUntouched) => prevUntouched.filter((m) => m.id !== nextMovie.id));
  
          return updatedSuggestions;
        }
      }
      return prevSuggestedMovies;
    });
  };
  

  const handleLikeMovie = (movie) => {
    setLikedMovies((prevLikedMovies) => [...prevLikedMovies, movie]);
    handleNextSuggestion(movie);
    if (modalRef.current) {
      const modal = window.bootstrap.Modal.getInstance(modalRef.current);
      modal.hide(); // Explicitly hide the modal
    }
  };
  
  const handleDislikeMovie = (movie) => {
    setDislikedMovies((prevDislikedMovies) => [...prevDislikedMovies, movie]);
    handleNextSuggestion(movie);
    if (modalRef.current) {
      const modal = window.bootstrap.Modal.getInstance(modalRef.current);
      modal.hide(); // Explicitly hide the modal
    }
  };
  

  const handleCardClick = (movie) => {
    setSelectedMovie(movie); // Set the selected movie
    if (modalRef.current) {
      const modal = new window.bootstrap.Modal(modalRef.current);
      modal.show(); // Show the modal
    }
  };
  
  return (
    <>
      {/* Movie Grid */}
      <div
        style={{
          display: "grid",
          background: "linear-gradient(to right, #484748, #A4A2A4)",
          gridTemplateColumns: "repeat(5, 1fr)", // 5 columns
          gap: "20px",
          padding: "10px",
          marginBottom: "0px",
        }}
      >
        {suggestedMovies.map((movie, index) => (
          <div
            key={movie.id || movie.poster_path || index}
            onClick={() => handleCardClick(movie)}
            style={{
              width: "220px",
              border: "5px solid rgba(72, 71, 72, 0.8)",
              opacity: "95%",
              borderRadius: "12px",
              cursor: "pointer",
              backgroundColor: "#A4A2A4",
              overflow: "hidden",
              textAlign: "center",
              paddding: "10px",
              margin: "auto",
            }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={`${movie.title} Poster`}
              style={{ width: "100%", height: "240px", objectFit: "cover", marginBottom: "10px",}}
            />
            <p style={{ fontSize: "14px", fontWeight: "bold" }}>{movie.title}</p>
          </div>
        ))}
      </div>
  
      {/* Modal */}
      <div
        className="modal fade"
        id="staticBackdrop"
        ref={modalRef}
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabIndex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered"
        style= {{marginTop: "5vh", marginBottom: "5vh", }}>
          <div className="modal-content"
          style={{ backgroundColor: "#484748"}}>
            {/* Modal Header */}
            <div className="modal-header"
            style={{
              backgroundColor: "#A4A2A4",
              borderBottom: "3px solid #ddd",
            }}
            >
              <h5 className="modal-title" id="staticBackdropLabel">
                {selectedMovie?.title || "Movie Details"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
  
            {/* Modal Body */}
            <div className="modal-body text-center"
            style={{ backgroundColor: "#C2C1C2", padding: "20px", }}>
              {selectedMovie && (
                <>
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                    alt={`${selectedMovie.title} Poster`}
                    style={{
                      width: "100%",
                      height: "300px",
                      objectFit: "contain",
                    }}
                  />
                  <h5>{selectedMovie.title}</h5>
                  
                
                    <p>
                    Genres: {selectedMovie.genres?.join(", ") || "N/A"}
                    <br />
                    Director: {selectedMovie.director || "N/A"}
                    <br />
                    Actors: {selectedMovie.actors?.join(", ") || "N/A"}
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
           <div className="modal-footer"
           style={{ backgroundColor: "#A4A2A4", borderTop: "3px solid #ddd",}}>
            <button
            type="button"
            className="btn btn-danger"
            style={{ marginRight: "auto" }} // Push Dislike button to the left
            onClick={() => handleDislikeMovie(selectedMovie)}>
              Dislike
              </button>
              <button
              type="button"
              className="btn btn-success"
              style={{ marginLeft: "auto" }} // Push Like button to the right
              onClick={() => handleLikeMovie(selectedMovie)}>
                Like
                </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
  
}

export default App;
