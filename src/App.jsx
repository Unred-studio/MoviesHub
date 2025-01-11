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
