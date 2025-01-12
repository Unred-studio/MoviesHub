import { useState, useEffect, useRef } from "react";
import fetchPopularMovies from '../server/api.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  const modalRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);  
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
          !suggestedMovies.includes(movie) &&
          !likedMovies.includes(movie) &&
          !dislikedMovies.includes(movie)
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
      const index = prevSuggestedMovies.indexOf(movie);
  
      if (index !== -1) {
        // Filter untouchedMovies to exclude those with strongly disliked properties
        let filteredMovies = untouchedMovies.filter((m) => {
          return (
            !m.genres.some((genre) => dislikedGenre.includes(genre)) &&
            !dislikedDirector.includes(m.director) &&
            !m.actors.some((actor) => dislikedActors.includes(actor))
          );
        });
  
        // Fallback to untouchedMovies if filtering leaves an empty list
        if (filteredMovies.length === 0) {
          filteredMovies = untouchedMovies;
        }
  
        // Sort by score descending
        filteredMovies.sort((a, b) => scoreMovie(b) - scoreMovie(a));
  
        // Pick the top movie
        const nextMovie = filteredMovies[0];
        if (nextMovie) {
          const updatedSuggestions = [...prevSuggestedMovies];
          updatedSuggestions[index] = nextMovie;
  
          // Update untouchedMovies to remove the selected movie
          setUntouchedMovies((prevUntouched) =>
            prevUntouched.filter((m) => m !== nextMovie)
          );
  
          return updatedSuggestions;
        }
      }
  
      return prevSuggestedMovies;
    });
  };
  

  const handleLikeMovie = (movie) => {
    setLikedMovies((prevLikedMovies) => [...prevLikedMovies, movie]);
    handleNextSuggestion(movie);
    setShowModal(false);
  };

  const handleDislikeMovie = (movie) => {
    setDislikedMovies((prevDislikedMovies) => [...prevDislikedMovies, movie]);
    handleNextSuggestion(movie);
    setShowModal(false);
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
          gridTemplateColumns: "repeat(5, 1fr)", // 5 columns
          gap: "15px",
          padding: "15px",
        }}
      >
        {suggestedMovies.map((movie, index) => (
          <div
            key={movie.id || movie.poster_path || index}
            onClick={() => handleCardClick(movie)}
            style={{
              width: "180px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: "#fff",
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={`${movie.title} Poster`}
              style={{ width: "100%", height: "250px", objectFit: "contain" }}
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
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
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
            <div className="modal-body text-center">
              {selectedMovie && (
                <>
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                    alt={`${selectedMovie.title} Poster`}
                    style={{
                      width: "100%",
                      height: "300px",
                      objectFit: "contain",
                      marginBottom: "15px",
                    }}
                  />
                  <h5>{selectedMovie.title}</h5>
                  <p>
                    synopsis: {selectedMovie.overview || "No overview available."}
                    <br />
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
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDislikeMovie(selectedMovie)}
              >
                Dislike
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleLikeMovie(selectedMovie)}
              >
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
