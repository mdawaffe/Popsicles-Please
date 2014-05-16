var config = require( './config' );

var Express = require( 'express' );
var app = Express();

var server = require( 'http' ).createServer( app );
var io = require( 'socket.io' ).listen( server );

if ( 'production' === process.env.NODE_ENV ) {
	io.enable( 'browser client minification' );
	io.enable( 'browser client etag' );
	io.enable( 'browser client gzip' );
	io.set( 'log level', 1 );
}

server.listen( config.server.port );

var ForecastIO = require( 'forecast.io' );
var forecast = new ForecastIO( config.ForecastIO );

var GoogleGeocode = require( './lib/google-geocode' );
var geocode = new GoogleGeocode( config.GoogleMaps );

var cache = require( './lib/cache' )( config.server.cache, config.server.cacheTTL );

var merge = require( './lib/merge' );

var PointService = require( './lib/point-service' );
var pointService = new PointService( config.locationsURL ? config.locationsURL : config.locations , forecast, geocode, cache );

pointService.start();

app.use( Express.static( __dirname + '/build' ) );

function emitPoint( socket, point ) {
	var output = merge( {}, point );

	if ( 'neighborhood' === output.locality ) {
		output.city = output.neighborhood;
	}
	delete output.neighborhood;
	delete output.locality;

	socket.emit( 'point', output );
}

function emitDone( socket ) {
	socket.emit( 'done' );
}

pointService.on( 'point', emitPoint.bind( null, io.sockets ) );

pointService.on( 'done', emitDone.bind( null, io.sockets ) );

io.sockets.on( 'connection', function( socket ) {
	pointService.points.forEach( emitPoint.bind( null, socket ) );
	if ( pointService.is_done ) {
		emitDone( socket );
	}
} );
