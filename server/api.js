import axios from "axios";

const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "d8fac9975782d13079fa284507f14ef8";

const fetchPopularMovies = async (start, end) => {
  try {
    const movies = [];
    for (let i = start; i <= end; i++) {
      if (i > 0) {
        const movies_response = await axios.get(`${BASE_URL}/movie/popular`, {
          params: {
            api_key: API_KEY,
            language: "en-US",
            page: i,
          },
        });
        const genres_response = await axios.get(
          `${BASE_URL}/genre/movie/list`,
          {
            params: {
              api_key: API_KEY,
              language: "en-US",
            },
          }
        );
        const genres_list = genres_response.data.genres;

        const getCrew = async (movie_id) => {
          try {
            const crew_response = await axios.get(
              `${BASE_URL}/movie/${movie_id}/credits`,
              {
                params: {
                  api_key: API_KEY,
                  language: "en-US",
                },
              }
            );
            const director =
              crew_response.data.crew.find(
                (member) => member.job === "Director"
              )?.name || "Unknown";

            const actors = crew_response.data.cast
              .slice(0, 3)
              .map((actor) => actor.name);
            return { director, actors };
          } catch (error) {
            console.error("Error fetching crew:", error);
          }
        };

        const movieData = await Promise.all(
          movies_response.data.results.map(async (movie, index) => {
            const { director, actors } = await getCrew(movie.id);
            return {
              id: movies.length + index + 1,
              genres: genres_list
                .filter((genre) => movie.genre_ids.includes(genre["id"]))
                .map((genre) => genre["name"]),
              title: movie.title,
              overview: movie.overview,
              poster_path: movie.poster_path,
              director,
              actors,
            };
          })
        );

        movies.push(...movieData);
      }
    }
    //console.log(JSON.stringify(movies, null, 2));
    return movies;
  } catch (error) {
    console.error("Error fetching or writing movies:", error);
  }
};

export default fetchPopularMovies;
