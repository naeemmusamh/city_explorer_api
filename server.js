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

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Locations(data) {
    this.searchquery = select;
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
app.get('./data/location', function(request, response) {
    const searchQuery = request.query;
    const select = searchQuery.city;
    if (!select) {
        response.status(500).send('sorry, no city was found');
        // throw new Error('i dont find any city');
    }
    const locationRow = require('./data/location.json');
    const locationData = new Locations(locationRow[0], select);
    return response.send(locationData);
});

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('./data/weather', function(request, response) {
    const weatherRow = require('./data/weather.json');
    const result = [];
    weatherRow.nearby_weather.forEach(element => {
        const weatherData = new Weathers(element.weather.description, element.valid_date);
        result.push(weatherData);
    });
    return response.send(result);
});

app.use('*', (request, response) => {
    response.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));