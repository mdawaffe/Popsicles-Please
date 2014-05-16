Popsicles Please
================

Web server that displays a list of locations that need popsicle delivery.

Dependencies
------------

* [Forecast.io API](https://developer.forecast.io/)
* [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding/)

Configuration
-------------

Configuration can be done by manually editing `config.js` or by setting the
various environment variables used by that file as described below.

### Server

~~~js
config.server = {
	// port for server to listen on
	port    : process.env.PORT      || 80,

	// path to the cache file
	cache   : process.env.CACHE     || 'cache.json',

	// time for which to cache each item (ms)
	cacheTTL: process.env.CACHE_TTL || 14400000
}
~~~

### Forecast.io

~~~js
config.ForecastIO = {
	// API key
	APIKey : process.env.FORECAST_API_KEY,

	// HTTP request timeout (ms)
	timeout: process.env.FORECAST_API_TIMEOUT || 10000
};
~~~

### Google Geocoding

~~~js
config.GoogleMaps = {
	// API key
	APIKey : process.env.GOOGLE_MAPS_API_KEY,

	// HTTP request timeout (ms)
	timeout: process.env.GOOGLE_MAPS_API_TIMEOUT || 2000
};
~~~

### Locations

One of the two (`config.locationsURL` or `config.locations`) is required.

~~~js
// Optional: URL frow which to parse locations.
// We look for [geo microformats](http://www.microformats.org/wiki/geo)
// (but we're not very smart at parsing them).
config.locationsURL = process.env.LOCATIONS_URL;

// Optional: Array of [ lat, lng ] points.
config.locations = [
	[  34.147639, -118.143863 ]
	//, ...
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
