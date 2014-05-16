var config = {};
module.exports = config;

// Server
config.server = {
	// port for server to listen on
	port    : process.env.PP_PORT      || 80,

	// path to the cache file
	cache   : process.env.PP_CACHE     || 'cache.json',

	// time for which to cache each item (ms)
	cacheTTL: process.env.PP_CACHE_TTL || 14400000
}

// Forecast.io
config.ForecastIO = {
	// API key
	APIKey : process.env.PP_FORECAST_API_KEY,

	// HTTP request timeout (ms)
	timeout: process.env.PP_FORECAST_API_TIMEOUT || 10000
};

// Google Geocoding
config.GoogleMaps = {
	// API key
	APIKey : process.env.PP_GOOGLE_MAPS_API_KEY,

	// HTTP request timeout (ms)
	timeout: process.env.PP_GOOGLE_MAPS_API_TIMEOUT || 2000
};

// Locations
// One of the two (config.locationsURL or config.locations) is required.

// Optional: URL frow which to parse locations.
// We look for [geo microformats](http://www.microformats.org/wiki/geo)
// (but we're not very smart at parsing them).
config.locationsURL = process.env.PP_LOCATIONS_URL;

// Optional: Array of [ lat, lng ] points.
config.locations = [
	[  34.147639, -118.143863 ]
	//, ...
];
