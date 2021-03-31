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
const PORT = process.env.PORT;
const LOCATION_API_KEY = process.env.LOCATION_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARK_API_KEY = process.env.PARK_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

//the app setup
const app = express();
app.use(cors());

//the app setyp to database
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
    this.city_name = data.forecast;
    this.valid_date = data.time;
}

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Park(data) {
    this.name = data.name;
    this.description = data.description;
    this.address = `${data.addresses[0].line1} ${data.addresses[0].city} ${data.addresses[0].statecode} ${data.addresses[0].postalcode}`;
    this.fees = data.fess[0] || '0.00';
    this.longitude = data.url;
}

//Create a route with a method and a path.
//invoke a function to convert the search query to a latitude and longitude.
// Create a function to check the database for the location information.
app.get('/location', function(request, response) {
    const searchQuery = request.query.city;
    if (!searchQuery) {
        response.status(404).send('sorry, no search query was found');
    }
    getLocationsDataBase(cityQuery).then(responseData => {
        response.status(200).json(responseData);
    }).catch((error) => {
        console.log('error', error);
        response.staus(500).send('sorry, something wrong');
    });
});

function getLocationsDataBase(city) {
    const safeValues = [city];
    const sqlQuery = `SELECT * FROM locations WHERE search_query=$1`;
    return client.query(sqlQuery, safeValues).then(result => {
        console.log(cityQuery);
        if (result.rows.length !== 0) {
            return result.rows[0];
        } else {
            const url = 'https://eu1.locationiq.com/v1/search.php?';
            const cityQuery = {
                key: LOCATION_API_KEY,
                city: city,
                format: 'json',
            };
            console.log(responseData.body);
            return superagent.get(url).query(cityQuery).then(responseData => {
                const locationData = new Locations(responseData.body[0], city);
                const safeValues = [city, Locations.formatted_query, Locations.latitude, Locations.longitude];
                const sqlQuery = `INSERT INTO locations(search_query,formatted_query,latitude,longitude) VALUES($1,$2,$3,$4)`;
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
    searchQuery = request.query.city;
    const url = `https://api.weatherbit.io/v2.0/history/daily?`;
    const cityQuery = {
        lat: request.query.latitude,
        lon: request.query.longitude,
        key: WEATHER_API_KEY,
    };
    // const weatherRow = require('./data/weather.json');
    superagent.get(url).query(cityQuery).then(requestData => {
        const weatherData = requestData.body.data.map(weather => {
            return new Weathers(weather);
        });
        response.send(weatherData);
    }).catch((error) => {
        console.log('error', error);
        response.staus(500).send('sorry, something wrong');
    });
});

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('/park', function(request, response) {
    // let city = request.query.city;
    const url = `https://developer.nps.gov/api/v1/parks?`;
    const cityQuery = {
        lat: request.query.latitude,
        lon: request.query.longitude,
        key: PARK_API_KEY,
    };
    // const weatherRow = require('./data/weather.json');
    superagent.get(url).query(cityQuery).then(requestData => {
        const parkData = requestData.body.data.map(park => {
            return new Park(park);
        });
        response.send(parkData);
    }).catch((error) => {
        console.log('error', error);
        response.staus(500).send('sorry, something wrong');
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