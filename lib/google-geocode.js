var request = require( 'request' );

function Geocode( options ) {
	this.APIKey = options.APIKey;
	this.timeout = options.timeout || 2000;
}

function geo_request( url, opts, callback ) {
	opts.sensor = 'false';
	opts.key = this.APIKey;

	return request( {
		uri: url,
		qs: opts,
		timeout: this.timeout,
		json: true
	}, function( err, res, data ) {
		if ( err ) {
			callback( err, res );
		} else if ( 'OK' !== data.status ) {
			callback( data.status, data );
		} else {
			callback( null, data );
		}
	} );
}

function geocode( address, opts, callback ) {
	if ( 'function' === typeof opts ) {
		callback = opts;
		opts = {};
	}

	opts.address = address;

	return geo_request.call( this, 'https://maps.googleapis.com/maps/api/geocode/json', opts, callback );
}

function reverse( lat, lng, opts, callback ) {
	if ( 'function' === typeof opts ) {
		callback = opts;
		opts = {};
	}

	opts.latlng = lat.toString() + ',' + lng.toString();

	return geo_request.call( this, 'https://maps.googleapis.com/maps/api/geocode/json', opts, callback );
}

Geocode.prototype.geocode = geocode;
Geocode.prototype.reverse = reverse;

module.exports = Geocode;
