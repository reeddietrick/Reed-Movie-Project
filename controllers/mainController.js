import Movie from '../models/Movie.js';


let savedMovies, totalMovies, totalTimesWatched, sortCriteria, selectedMovies;




export const getMovieDetailsById = async (req, res) => {
  const movieId = req.params.id;

  try {
    // Fetch the movie details by ID
    const selectedMovie = await Movie.findById(movieId);

    if (selectedMovie) {
      // If the movie is found, send it as JSON response
      res.json({ selectedMovie });
    } else {
      // If the movie is not found, send an error response
      res.status(404).json({ error: 'Movie not found' });
    }
  } catch (error) {
    console.error('Error getting movie details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const showSelectedMovieDetails = async (req, res) => {
  const movieId = req.params.id;

  try {
    // Fetch the selected movie details by ID
    const selectedMovie = await Movie.findById(movieId);

    if (selectedMovie) {
      // If the movie is found, render the details page with the selected movie details
      res.render('details', { movie: selectedMovie });
    } else {
      // If the movie is not found, send an error response
      res.status(404).send('Movie not found');
    }
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).send('Error fetching movie details');
  }
};

export const showMovies = async (req, res) => {


  await aggregateMoviesData();
  savedMovies = await Movie.find().sort(sortCriteria);
    selectedMovies = await Movie.find().sort(sortCriteria);

  res.render('index', { savedMovies, totalMovies, totalTimesWatched, selectedMovies });

}

export const searchMovies = async (req, res) => {
  const movieTitle = req.body.movieTitle;
  try {
    const response = await fetch(`http://www.omdbapi.com/?t=${movieTitle}&apikey=${process.env.MOVIE_KEY}`);
    const movie = await response.json();
    console.log(movie);
    res.render('results', {movie});
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
};

export const showMovieDetailsPage = async (req, res) => {
  const movieId = req.params.id;

  try {
    // Try to fetch movie details from the local database
    const movie = await Movie.findById(movieId);

    if (movie) {
      // If movie is found in the local database, render details.ejs with local movie details
      res.render('details', { movie });
    } else {
      // If movie is not found in the local database, fetch details from the OMDB API
      const response = await fetch(`http://www.omdbapi.com/?i=${movieId}&apikey=${process.env.MOVIE_KEY}`);
      const apiMovie = await response.json();

      if (apiMovie.Error) {
        // Handle error from OMDB API
        console.error('Error fetching movie details from OMDB API:', apiMovie.Error);
        res.status(500).send('Error fetching movie details');
        return;
      }

      // Render details.ejs with details fetched from OMDB API
      res.render('details', { movie: apiMovie });
    }
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).send('Error fetching movie details');
  }
};

export const saveMovie = async (req, res) => {
  const { title, poster, director, year, boxOffice, genre, plot, awards} = req.body;

  try {
    // Check if the movie already exists in the database
    let movie = await Movie.findOne({ title: title });

    if (movie) {
      // If movie exists, increment the timesWatched
      movie.timesWatched += 1;
      await movie.save();
    } else {
      // If movie doesn't exist, create a new one
      movie = new Movie({
        title,
        poster,
        director,
        genre,
        plot,
        awards,
        year,
        boxOffice,
        timesWatched: 1
      });
      await movie.save();
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const watchMovie = async (req, res) => {
  const movieId = req.params.id;

  try {
    const movie = await Movie.findById(movieId);
    if (movie) {
      movie.timesWatched += 1;
      await movie.save();
      req.flash('update', `You watched ${movie.title}.  Did you know it grossed ${movie.boxOffice} at the box office?!`)
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const deleteMovie = async (req, res) => {
  const movieId = req.params.id;

  try {
    const result = await Movie.findByIdAndDelete(movieId);
    console.log(result);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const sortMovies = async (req, res) => {
  try {
    sortCriteria = { timesWatched: -1 };
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

const aggregateMoviesData = async () => {
  try {
    const result = await Movie.aggregate([
      {
        $group: {
          _id: null, // Grouping without a specific field to aggregate all documents
          totalMovies: { $sum: 1 }, // Counting the total number of movies
          totalTimesWatched: { $sum: "$timesWatched" } // Summing up all timesWatched values
        }
      }
    ]);

    if (result.length > 0) {
      // Extracting the result from the first element of the result array
      totalMovies = result[0].totalMovies;
      totalTimesWatched = result[0].totalTimesWatched;
      console.log(`Total Movies: ${totalMovies}, Total Times Watched: ${totalTimesWatched}`);
    } else {
      console.log("No data found.");
    }
  } catch (error) {
    console.error("Error aggregating movie data:", error);
  }
};
