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

//A constructor function will ensure that each object is created according to the
//same format when your server receives the external data.
function Parks(data) {
    this.name = data.name;
    this.description = data.description;
    this.address = `${data.addresses[0].line1} ${data.addresses[0].city} ${data.addresses[0].statecode} ${data.addresses[0].postalcode}`;
    this.fee = data.fees[0] || '1.00';
    this.longitude = data.url;
}
//Creates an env application.
const PORT = process.env.PORT || 9901;

//Create a route with a method and a path.
//invoke a function to convert the search query to a latitude and longitude.
app.get('/location', function(request, response) {
    const searchQuery = request.query.city;
    if (!searchQuery) {
        response.status(500).send('sorry, no city was found');
    }
    superagent.get(url).query(cityQuery).then(responseData => {
        // console.log(responseData.body);
        const locationData = new Locations(responseData.body[0], searchQuery);
        console.log(locationData);
        response.status(200).send(locationData);
    }).catch((error) => {
        console.log('error', error);
        response.status(500).send('sorry, something wrong');
    });
});

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
//response which contains the necessary information for correct client rendering.
app.get('/weather', function(request, response) {
    const url = `https://api.weatherbit.io/v2.0/forecast/daily`;
    const cityQuery = {
        lat: request.query.latitude,
        lon: request.query.longitude,
        key: WEATHER_API_KEY
    }
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
    response.send(result);
});

//Create a route with a method and a path.
//weather object of the result, return an array of objects for each day of the
// response which contains the necessary information for correct client rendering.
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

app.use('*', (request, response) => {
    response.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));