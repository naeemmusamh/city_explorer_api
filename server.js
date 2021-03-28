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
const PORT = process.env.PORT;

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Locations(data) {
    this.display_name = data.display_name;
    this.lat = data.lat;
    this.lon = data.lon;
}

//A constructor function will ensure that each object is created according to the
//same format when the server receives data.
function Weathers(data) {
    this.city_name = data.weather.description;
    this.valid_date = data.valid_date;
}

//Create a route with a method and a path.
//invoke a function to convert the search query to a latitude and longitude.
app.get('/data/location', function(request, response) {
    const searchQuery = request.query;
    const locationRow = require('data/location.json');
    const locationData = new Locations(locationRow[0]);
    return response.send(locationData);
});

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('/data/weather', function(request, response) {
    const weatherRow = require('data/weather.json');
    const result = [];
    weatherRow.nearby_weather.forEach(element => {
        result.push(new Weathers(element));
    });
    return response.send(result);
});

app.use('*', (request, response) => {
    response.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));