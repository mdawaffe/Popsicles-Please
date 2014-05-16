function merge( dest ) {
	Array.prototype.slice.call( arguments, 1 ).forEach( function( src ) {
                for ( prop in src ) {
			dest[prop] = src[prop];
                }
	} );

	return dest;
}

module.exports = merge;
