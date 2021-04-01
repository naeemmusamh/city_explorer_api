'use strict';

//As early as possible in your application, require and configure dotenv.
require('dotenv').config();

//Creates an Express application.
const express = require('express');

//Creates an cors application.
const cors = require('cors');

//the app setup
const app = express();
app.use(cors());

//Creates an env application.
const PORT = process.env.PORT || 9901;

//Create a route with a method and a path.
//invoke a function to convert the search query to a latitude and longitude.
app.get('/location', function(request, response) {
    const searchQuery = request.query.city;
    if (!searchQuery) {
        response.status(500).send('sorry, no city was found');
    }
    const locationRow = require('./data/location.json');
    const locationData = new Locations(locationRow[0], searchQuery)
    response.send(locationData);
    console.log(locationData);
});

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('/weather', function handelWeather(request, response) {
    const weatherRow = require('./data/weather.json');
    const result = [];
    const weatherData = weatherRow.data;
    weatherData.forEach(element => {
        const weatherData = new Weathers(element);
        result.push(weatherData);
        console.log(weatherData);
    });
    response.send(result);
});

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Locations(data, searchQuery) {
    this.search_query = searchQuery;
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

app.use('*', (request, response) => {
    response.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));