var config = {};
module.exports = config;

// Server
config.server = {
	port: 3000,         // port for server to listen on
	cache: 'cache.json' // path to the cache file
	cacheTTL: 86400000, // time for which to cache each item (ms)
}

// Forecast.io
config.ForecastIO = {
	APIKey: process.env.FORECAST_API_KEY, // API key
	timeout: 10000                        // HTTP request timeout (ms)
};

// Google Geocoding
config.GoogleMaps = {
	APIKey: process.env.GOOGLE_MAPS_API_KEY, // API key
	timeout: 2000                            // HTTP request timeout (ms)
};

// Locations
// One of the two (config.locationsURL or config.locations) is required.

// Optional: URL frow which to parse locations.
// We look for [geo microformats](http://www.microformats.org/wiki/geo)
// (but we're not very smart at parsing them).
//config.locationsURL = 'http://example.com/';

// Optional: Array of [ lat, lng ] points.
config.locations = [
	[  34.147639, -118.143863 ]
];
