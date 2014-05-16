Popsicles Please
================

Web server that displays a list of locations that need popsicle delivery.

Dependencies
------------

* [Forecast.io API](https://developer.forecast.io/)
* [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding/)

Configuration
-------------

~~~bash
$ cp config-sample.js config.js
~~~

### Server

~~~js
config.server = {
	port: 3000,         // port for server to listen on
	cache: 'cache.json' // path to cache file
	cacheTTL: 86400000, // time for which to cache each item (ms)
}
~~~

### Forecast.io

~~~js
config.ForecastIO = {
	APIKey: process.env.FORECAST_API_KEY, // API key
	timeout: 10000                        // HTTP request timeout (ms)
};
~~~

### Google Geocoding

~~~js
config.GoogleMaps = {
	APIKey: process.env.GOOGLE_MAPS_API_KEY, // API key
	timeout: 2000                            // HTTP request timeout (ms)
};
~~~

### Locations

One of the two (`config.locationsURL` or `config.locations`) is required.

~~~js
// Optional: URL frow which to parse locations.
// We look for [geo microformats](http://www.microformats.org/wiki/geo)
// (but we're not very smart at parsing them).
config.locationsURL = 'http://example.com/';

// Optional: Array of [ lat, lng ] points.
config.locations = [
	[  34.147639, -118.143863 ]
];
~~~

Launching
---------

~~~bash
$ node server.js
~~~

If you've configured your API keys to be read from `process.env` (as in `config-sample.js`),
you'll need to set the environment variables:

~~~bash
$ GOOGLE_MAPS_API_KEY=abc123 FORECAST_API_KEY=def456 node server.js
~~~

Development
-----------

1. `npm install`
2. `grunt`
3. `grunt watch`
