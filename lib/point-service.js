var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter

var dom = require( 'jsdom' );

var Promise = require( 'promise' );
var Queue = require( 'queue' );

var log;
if ( 'production' === process.env.NODE_ENV ) {
	log = function() {};
} else {
	log = function() {
		console.log.apply( null, Array.prototype.slice.call( arguments ) );
	};
}

var merge = require( './merge' );

function PointService( locations, forecast, geocode, cache ) {
	var _this = this;

	EventEmitter.call( this );

	if ( 'string' === typeof locations ) {
		this.locationsURL = locations;
		this.locations = [];
	} else {
		this.locationsURL = null;
		this.locations = locations;
	}

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

function get_locations( url, callback ) {
	log( "> GEO:", url );
	dom.env( url, function( err, window ) {
		if ( err ) {
			callback( err, [] );
			return;
		}

		var geos = window.document.querySelectorAll( '.geo' );
		var locations = [];
		var alreadys = [];

		var i, l, geo, location, already;
		for ( i = 0, l = geos.length; i < l; i++ ) {
			geo = geos[i];
			location = [
				parseFloat( geos[i].querySelector( '.latitude' ).textContent ),
				parseFloat( geos[i].querySelector( '.longitude' ).textContent )
			];

			already = location.join( ',' );

			if ( alreadys.indexOf( already ) < 0 ) {
				alreadys.push( already );
				locations.push( location );
			}
		}

		log( "< GEO:", url, locations.length );
		callback( null, locations );
		window.close();
	} );
}

function start() {
	var _this = this;

	var go = function() {
		_this.cache.read( _this.get_all_points.bind( _this ) );
	}

	if ( this.locationsURL ) {
		get_locations( this.locationsURL, function( err, locations ) {
			_this.locations = locations;
			go();
		} );
	} else {
		go();
	}

	if ( this.cache.ttl ) {
		setTimeout( this.start.bind( this ), this.cache.ttl + 600000 );
	}
}

function get_temperature_from_forecast( lat, lng ) {
	var _this = this;

	return new Promise( function( resolve, reject ) {
		log( "> FORECAST:", lat, lng );
		_this.forecast.get( lat, lng, {
			exclude: "currently,minutely,hourly,alerts,flags"
		}, function( err, res, data ) {
			if ( err ) {
				log( "< FORECAST!", lat, lng, err );
				resolve( {} );
			} else {
				log( "< FORECAST:", lat, lng, data.daily.data[0].temperatureMax );
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
		log( "> GOOGLE:", lat, lng );
		_this.geocode.reverse( lat, lng, { result_type: types.join( '|' ) }, function( err, data ) {
			if ( err ) {
				log( "< GOOGLE!", lat, lng, err );
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

				log( "< GOOGLE:", lat, lng, the_result.formatted_address );
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
			var point = merge.bind( null, {} ).apply( null, data );

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
