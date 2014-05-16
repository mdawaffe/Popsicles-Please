var fs = require( 'fs' );

function Cache( file, ttl ) {
	if ( ! ( this instanceof Cache ) )
		return new Cache( file, ttl );

	this.file = file;
	this.ttl = ttl || 0;
	this.delay_write = null;

	this.data = {};
}

function is_recent( time ) {
	if ( this.ttl <= 0 ) {
		return true;
	}

	return time >= ( Date.now() - this.ttl );
}

function read( callback ) {
	var _this = this;
	fs.stat( this.file, function( err, stat ) {
		if ( ! err && _this.is_recent( stat.mtime ) ) {
			fs.readFile( _this.file, { encoding: 'utf8' }, function( err, data ) {
				_this.data = JSON.parse( data );
				callback( err );
			} );
		} else {
			callback( null );
		}
	} );
}

function write_now( callback ) {
	clearTimeout( this.delay_write );
	this.delay_write = null;
	fs.writeFile( this.file, JSON.stringify( this.data ), callback );
}

function write_later( callback ) {
	if ( this.delay_write ) {
		if ( callback ) {
			callback( 'delayed' );
		}
		return;
	}

	this.delay_write = setTimeout( write_now.bind( this, callback ), 10000 );
}

function write( callback ) {
	var _this = this;
	fs.stat( this.file, function( err, stat ) {
		if ( ! err && _this.is_recent( stat.mtime ) ) {
			write_later.call( _this, callback );
		} else {
			write_now.call( _this, callback );
		}
	} );
}

function get( key ) {
	return this.data[key];
}

function set( key, value ) {
	this.data[key] = value;
	write_later.call( this );
}

Cache.prototype.is_recent = is_recent;
Cache.prototype.read = read;
Cache.prototype.write = write;
Cache.prototype.get = get;
Cache.prototype.set = set;

module.exports = Cache;
