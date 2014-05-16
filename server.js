var config = require( './config' );

var Express = require( 'express' );
var app = Express();

var server = require( 'http' ).createServer( app );
var io = require( 'socket.io' ).listen( server );

server.listen( config.server.port );

var ForecastIO = require( 'forecast.io' );
var forecast = new ForecastIO( config.ForecastIO );

var GoogleGeocode = require( './lib/google-geocode' );
var geocode = new GoogleGeocode( config.GoogleMaps );

var cache = require( './lib/cache' )( config.server.cache, 86400000 ); // 1 day

var PointService = require( './lib/point-service' );
var pointService = new PointService( config.locations, forecast, geocode, cache );

pointService.start();

app.get( '/', function( req, res ) {
	res.sendfile( __dirname + '/index.html' );
} );

app.use( Express.static( __dirname + '/public' ) );

io.sockets.on( 'connection', function( socket ) {
	function emitPoint( point ) {
		socket.emit( 'point', point );
	}

	function emitDone() {
		socket.emit( 'done' );
	}

	pointService.on( 'point', emitPoint );
	pointService.on( 'done', emitDone );

	pointService.points.forEach( emitPoint );
	if ( pointService.is_done ) {
		emitDone();
	}
} );
