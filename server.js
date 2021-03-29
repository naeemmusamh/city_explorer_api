'use strict';

//As early as possible in your application, require and configure dotenv.
require('dotenv').config();

//Creates an Express application.
const express = require('express');

//Creates an cors application.
const cors = require('cors');

//create an superagent application
const superagent = require('superagent');

//Creates an env application.
const PORT = process.env.PORT;
const LOCATION_API_KEY = process.env.LOCATION_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

//the app setup
const app = express();
app.use(cors());

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Locations(data, search_query) {
    this.search_query = search_query.select;
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

//Create a route with a method and a path.
//invoke a function to convert the search query to a latitude and longitude.
app.get('/location', function(request, response) {
    const searchQuery = request.query.city;
    // const select = searchQuery.city;
    const url = 'https://eu1.locationiq.com/v1/search.php';
    const cityQuery = {
        key: LOCATION_API_KEY,
        city: searchQuery,
        format: 'json',
    };
    console.log(cityQuery);
    if (!searchQuery) {
        response.status(404).send('sorry, no search query was found');
        // throw new Error('i dont find any city');
    }
    superagent.get(url).query(cityQuery).then(responseData => {
        const locationData = new Locations(searchQuery, responseData.body[0]);
        response.status(200).send(locationData);
    }).catch((error) => {
        console.log('ereor', error);
        response.staus(500).send('sorry, something wrong');
    });
});

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('/weather', function(request, response) {
    let city;
    const url = `https://api.weatherbit.io/v2.0/history/daily?key${WEATHER_API_KEY}&city=${city}`;
    // const weatherRow = require('./data/weather.json');
    superagent.get(url).then(element => {
        const weatherData = new Weathers(element.weather.description, element.valid_date);
        response.status(200).send(weatherData);
    }).catch((error) => {
        console.log('ereor', error);
        response.staus(500).send('sorry, something wrong');
    });
});

app.use('*', (request, response) => {
    response.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));