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
          background: "linear-gradient(to right, #9B287B, #007AF5, #C4E0F9)",
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
              border: "8px solid rgba(125, 188, 242, 0.4)",
              borderRadius: "12px",
              cursor: "pointer",
              backgroundColor: "#58A8EE",
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
          style={{ backgroundColor: "#ffe4b5"}}>
            {/* Modal Header */}
            <div className="modal-header"
            style={{
              backgroundColor: "#58A8EE",
              borderBottom: "1px solid #ddd",
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
            style={{ backgroundColor: "#58A8EE", padding: "20px", }}>
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
                    Synopsis: {selectedMovie.overview || "No overview available."}
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
           <div className="modal-footer"
           style={{ backgroundColor: "#58A8EE", borderTop: "1px solid #ddd",}}>
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
