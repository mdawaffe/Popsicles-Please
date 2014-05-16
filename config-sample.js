var config = {};

config.server = {
	port: 3000,
	cache: 'cache.json'
}

config.ForecastIO = {
	APIKey: process.env.FORECAST_API_KEY,
	timeout: 10000
};

config.GoogleMaps = {
	APIKey: process.env.GOOGLE_MAPS_API_KEY,
	timeout: 2000
};

config.locations = [
	[  34.147639, -118.143863 ]
];

module.exports = config;
