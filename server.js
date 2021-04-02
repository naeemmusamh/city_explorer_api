'use strict';

//As early as possible in your application, require and configure dotenv.
require('dotenv').config();

//Creates an Express application.
const express = require('express');

//Creates an cors application.
const cors = require('cors');

const pg = require('pg');

//create an superagent application
const superagent = require('superagent');

//Creates an env application.
const PORT = process.env.PORT || 9091;
const LOCATION_API_KEY = process.env.LOCATION_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARK_API_KEY = process.env.PARK_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const YELP_API_KEY = process.env.YELP_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;

//the app setup
const app = express();
app.use(cors());

//the app setup to database
const client = new pg.Client(DATABASE_URL);

app.get('/', (request, response) => {
    response.status(200).send('every thing good!!');
});

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Locations(data, search_query) {
    this.search_query = search_query;
    this.formatted_query = data.display_name;
    this.latitude = data.lat;
    this.longitude = data.lon;
}

//A constructor function will ensure that each object is created according to the
//same format when the server receives data.
function Weathers(data) {
    this.forecast = data.weather.description;
    this.time = data.valid_date;
}

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Parks(data) {
    this.name = data.name;
    this.description = data.description;
    this.address = `${data.addresses[0].line1} ${data.addresses[0].city} ${data.addresses[0].statecode} ${data.addresses[0].postalcode}`;
    this.fees = data.fess[0] || '0.00';
    this.longitude = data.url;
}

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Yelp(data) {
    this.name = data.name;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url = data.url;
}

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Movie(data) {
    this.title = data.title;
    this.overview = data.overview;
    this.average_votes = data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${data.poster_path}`;
    this.popularity = data.popularity;
    this.released_on = data.release_date;
}

//Create a route with a method and a path.
//invoke a function to convert the search query to a latitude and longitude.
// Create a function to check the database for the location information.
app.get('/location', function(request, response) {
    const searchQuery = request.query.city;
    if (!searchQuery) {
        response.status(404).send('sorry, no search query was found');
    }
    getLocationsDataBase(searchQuery).then(responseData => {
        response.status(200).json(responseData);
    }).catch((error) => {
        console.log('error', error);
        response.status(500).send('sorry, something wrong');
    });
});

function getLocationsDataBase(city) {
    console.log('from the new function');
    const safeValues = [city];
    const sqlQuery = `SELECT * FROM locations WHERE search_query=$1`;
    return client.query(sqlQuery, safeValues).then(result => {
        console.log('sending form the data base');
        if (result.rows.length !== 0) {
            return result.rows[0];
        } else {
            const url = 'https://eu1.locationiq.com/v1/search.php';
            const cityQuery = {
                key: LOCATION_API_KEY,
                city: city,
                format: 'json',
            };
            // console.log(responseData.body);
            return superagent.get(url).query(cityQuery).then(responseData => {
                const locationData = new Locations(responseData.body[0], city);
                const safeValues = [city, Locations.formatted_query, Locations.latitude, Locations.longitude];
                const sqlQuery = `INSERT INTO locations(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;
                client.query(sqlQuery, safeValues);
                return locationData;
            }).catch((error) => {
                console.log(error);
            });
        }
    });
}

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('/weather', function(request, response) {
    const url = `https://api.weatherbit.io/v2.0/forecast/daily`;
    const cityQuery = {
        lat: request.query.latitude,
        lon: request.query.longitude,
        key: WEATHER_API_KEY,
    };
    superagent.get(url).query(cityQuery).then(requestData => {
        const weatherData = requestData.body.data.map(weather => {
            console.log(weatherData);
            return new Weathers(weather);
            // console.log(weatherData);
        });
        response.send(weatherData);
    }).catch((error) => {
        console.log('error', error);
        response.status(500).send('sorry, something wrong');
    });
});

//Create a route with a method and a path.
//park object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('/park', function(request, response) {
    const url = `https://developer.nps.gov/api/v1/parks?q=${request.query.search_query}&api_key=${PARK_API_KEY}&limit=10`;
    superagent.get(url).then(requestData => {
        const parkData = requestData.body.data.map(park => {
            console.log(parkData);
            return new Parks(park);
        });
        response.send(parkData);
    }).catch((error) => {
        console.log('error', error);
        response.status(500).send('sorry, something wrong');
    });
});

//Create a route with a method and a path.
app.get('/movie', function(request, response) {
    const url = `https://api.themoviedb.org/3/movie/550?api_key=${MOVIE_API_KEY}&query=${request.query.city}`;
    superagent.get(url).then(requestData => {
        const movieData = requestData.body.results.map(movieElement => {
            console.log(movieData);
            return new Movie(movieElement);
        });
        response.send(parkData);
    }).catch((error) => {
        console.log('error', error);
        response.status(500).send('sorry, something wrong');
    });
});

//Create a route with a method and a path.
app.get('/yelp', function(request, response) {
    const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${request.query.latitude}&longitude=${request.query.longitude}&limit=20`;
    superagent.get(url).set(`Authorization`, `Bearer ${YELP_API_KEY}`).then(requestData => {
        const yelpData = requestData.body.results.map(element => {
            console.log(yelpData);
            return new Yelp(element);
        });
        response.send(parkData);
    }).catch((error) => {
        console.log('error', error);
        response.status(500).send('sorry, something wrong');
    });
});

app.use('*', (request, response) => {
    response.send('all good nothing to see here!');
});

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('connect to database:', client.connectionParameters.database);
        console.log(`Listening to Port ${PORT}`);
    });
});