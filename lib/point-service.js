var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter

var Promise = require( 'promise' );
var Queue = require( 'queue' );

function PointService( locations, forecast, geocode, cache ) {
	var _this = this;

	EventEmitter.call( this );

	this.locations = locations;
	this.is_done = false;

	this.forecast = forecast;
	this.geocode = geocode;
	this.cache = cache;

	this.points = [];
	this.queue = Queue( {
		timeout: 15000,
		concurrency: 3
	} );

	this.queue.on( 'success', function( point ) {
		_this.points.push( point );
		_this.emit( 'point', point );
	} );

	this.queue.on( 'end', function( err ) {
		if ( err ) {
			return;
		}

		_this.points.sort( function( a, b ) {
			return b.temperature - a.temperature;
		} );

		_this.is_done = true;
		_this.emit( 'done' );

		_this.cache.write();
	} );
}

inherits( PointService, EventEmitter );

function start() {
	this.cache.read( this.get_all_points.bind( this ) );
}

function get_temperature_from_forecast( lat, lng ) {
	var _this = this;

	return new Promise( function( resolve, reject ) {
		console.log( "> FORECAST:", lat, lng );
		_this.forecast.get( lat, lng, {
			exclude: "currently,minutely,hourly,alerts,flags"
		}, function( err, res, data ) {
			if ( err ) {
				console.error( "< FORECAST:", lat, lng, err );
				resolve( {} );
			} else {
				console.log( "< FORECAST:", lat, lng, data.daily.data[0].temperatureMax );
				resolve( {
					latitude: data.latitude,
					longitude: data.longitude,
					temperature: data.daily.data[0].temperatureMax,
					time: parseInt( Date.now(), 10 )
				} );
			}
		} );
	} );
}

function get_city_from_google_maps( lat, lng ) {
	var _this = this;

	return new Promise( function( resolve, reject ) {
		var types = [ 'locality', 'administrative_area_level_3', 'administrative_area_level_2' ];
		console.log( "> GOOGLE:", lat, lng );
		_this.geocode.reverse( lat, lng, { result_type: types.join( '|' ) }, function( err, data ) {
			if ( err ) {
				console.error( "< GOOGLE:", lat, lng, err );
				resolve( {
					city: "[unknown]"
				} );
			} else {
				var the_result;

				data.results.some( function( result ) {
					return types.some( function( type ) {
						if ( result.types.indexOf( type ) > -1 ) {
							the_result = result;
							return true;
						}

						return false;
					} );
				} );

				if ( ! the_result ) {
					the_result = data.results[0];
				}

				console.log( "< GOOGLE:", lat, lng, the_result.formatted_address );
				resolve( {
					city: the_result.formatted_address,
					bounds: the_result.geometry.bounds
				} );
			}
		} );
	} );
}

function get_point( lat, lng, callback ) {
	var _this = this;
	var cache_key = lat.toString() + ',' + lng.toString();
	var cached = this.cache.get( cache_key );

	if ( 'undefined' === typeof cached || ! this.cache.is_recent( cached.time ) ) {
		Promise.all( [
			_this.get_temperature_from_forecast( lat, lng ),
			_this.get_city_from_google_maps( lat, lng )
		] ).then( function( data ) {
			var point = {};

			data.forEach( function( datum ) {
				for ( prop in datum ) {
					point[prop] = datum[prop];
				}
			} );

			_this.cache.set( cache_key, point );

			callback( null, point );
		}, function( err ) {
			callback( err );
		} );
	} else {
		callback( null, cached );
	}
}

function get_all_points() {
	var _this = this;
	this.queue.end( 'restart' );

	this.locations.map( function( latlng ) {
		_this.queue.push( function( next ) {
			_this.get_point.call( _this, latlng[0], latlng[1], next );
		} );
	} );

	this.points = [];
	this.queue.start();
}

PointService.prototype.start = start;
PointService.prototype.get_point = get_point;
PointService.prototype.get_all_points = get_all_points;
PointService.prototype.get_temperature_from_forecast = get_temperature_from_forecast;
PointService.prototype.get_city_from_google_maps = get_city_from_google_maps;

module.exports = PointService;
