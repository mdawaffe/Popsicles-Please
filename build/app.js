/** @jsx React.DOM */

function heatClass( temperature ) {
	if ( temperature < 50 ) {
		return 'cold';
	} else if ( temperature < 70 ) {
		return 'cool';
	} else if ( temperature < 80 ) {
		return 'nice';
	} else if ( temperature < 90 ) {
		return 'warm';
	}

	return 'hot';
}

var Point = React.createClass( {displayName: 'Point',
	handleHover: function( event ) {
		event.pointTemp = this.props.temperature;
		event.pointBounds = this.props.bounds;
		event.pointSticky = false;
		this.props.onUserSelectPoint( event );
	},

	handleClick: function( event ) {
		event.pointTemp = this.props.temperature;
		event.pointBounds = this.props.bounds;
		event.pointSticky = this.props.key;
		this.props.onUserSelectPoint( event );
	},

	render: function() {
		var className = [ heatClass( this.props.temperature ) ];

		if ( this.props.selected ) {
			className.push( 'selected' );
		}

		return (
			React.DOM.tr(
				{className:className.join( ' ' ),
				onMouseEnter:this.handleHover,
				onClick:this.handleClick}
			, 
				React.DOM.th( {scope:"row"}, this.props.city),
				React.DOM.td(null, Math.round( this.props.temperature ).toString() + ' °F')
			)
		);
	}
} );

var PointList = React.createClass( {displayName: 'PointList',
	render: function() {
		var _this = this;
		var points = this.props.points.map( function( point ) {
			var key = point.latitude.toString() + ',' + point.longitude.toString();
			return (
				Point(
					{onUserSelectPoint:_this.props.onUserSelectPoint,
					key:key,
					city:point.city,
					bounds:point.bounds,
					temperature:point.temperature,
					selected:key === _this.props.selectedPoint}
				)
			);
		} );

		return (
			React.DOM.table( {id:"list", className: false !== this.props.selectedPoint ? 'sticky' : '' }, 
				React.DOM.thead(null, 
					React.DOM.tr(null, 
						React.DOM.th( {scope:"col"}, "City"),
						React.DOM.th( {scope:"col"}, "Temperature")
					)
				),
				React.DOM.tbody( {id:"list-body"}, 
					points
				),
				React.DOM.tfoot(null, 
					React.DOM.tr(null, 
						React.DOM.td( {colSpan:"2"}, "Powered by ", React.DOM.a( {href:"http://forecast.io/"}, "Forecast"), " and ", React.DOM.a( {href:"https://developers.google.com/maps/documentation/geocoding/"}, "Google"),".")
					)
				)
			)
		);
	}
} );

var Loading = React.createClass( {displayName: 'Loading',
	render: function() {
		return (
			React.DOM.p( {className: this.props.done ? "loading done" : "loading pending" }, "Loading…")
		);
	}
} );

var Map = React.createClass( {displayName: 'Map',
	map: null,

	resize: function( southwest, northeast ) {
		var sw = L.latLng( southwest.lat, southwest.lng );
		var ne = L.latLng( northeast.lat, northeast.lng );
		var bounds = L.latLngBounds( sw, ne );

		this.map.fitBounds( bounds );
	},

	componentDidMount: function() {
		var container = document.getElementById( 'map-container' );
		if ( parseInt( container.style.height || 0, 10 ) < container.offsetWidth ) {
			container.style.height = container.offsetWidth.toString() + 'px';
		}

		this.map = L.map( 'map' );
		bob = this.map;

		this.resize( this.props.bounds.southwest, this.props.bounds.northeast );

		L.tileLayer( 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'examples.map-i86knfo3'
		} ).addTo( this.map );
	},

	componentWillReceiveProps: function( props ) {
		this.resize( props.bounds.southwest, props.bounds.northeast );
	},

	componentDidUpdate: function( prevProps ) {
		var tempEl, mapEl, size;

		if ( Math.round( prevProps.temperature ) === Math.round( this.props.temperature ) ) {
			return;
		}

		tempEl = this.refs.myTemp.getDOMNode();
		mapEl = tempEl.parentNode;
		size = parseInt( tempEl.style.fontSize || 100, 10 );

		while ( tempEl.offsetWidth <= mapEl.offsetWidth && tempEl.offsetHeight <= mapEl.offsetHeight ) {
			size++;
			tempEl.style.fontSize = size.toString() + 'px';
		}

		do {
			size--;
			tempEl.style.fontSize = size.toString() + 'px';
		} while ( tempEl.offsetWidth >= mapEl.offsetWidth || tempEl.offsetHeight >= mapEl.offsetHeight );
	},

	render: function() {
		var className = [ 'temperature', heatClass( this.props.temperature ) ];
		return (
			React.DOM.div( {id:"map-container"}, 
				React.DOM.div( {id:"map"}),
				React.DOM.span( {ref:"myTemp", className:className.join( ' ' )},  this.props.temperature ? Math.round( this.props.temperature ).toString() + '\u00A0°F' : '' )
			)
		);
	}
} );

var App = React.createClass( {displayName: 'App',
	tbodyEl: null,
	scrollDebounce: null,

	getInitialState: function() {
		return {
			points: [],
			selectedPoint: false,
			temperature: "",
			bounds: {
				northeast: {
					lat: 34.251905,
					lng: -118.0654789,
				},
				southwest: {
					lat: 34.1170368,
					lng: -118.1981391,
				}
			},
			is_scrolled: false,
			done: false
		}
	},

	componentWillMount: function() {
		var _this = this;
		var socket = io.connect( document.location.origin );

		socket.on( 'point', function( point ) {
			var points = _this.state.points.concat( [ point ] );
			points.sort( function( a, b ) {
				return b.temperature - a.temperature;
			} );

			_this.setState( {
				points: points
			} );
		} );

		socket.on( 'done', function() {
			_this.setState( {
				done: true
			} );
		} );
	},

	handleScroll: function( event ) {
		if ( this.scrollDebounce ) {
			return;
		}

		var again = function() {
			this.handleScroll;
			this.scrollDebounce = null;
		};

		this.scrollDebounce = setTimeout( again.bind( this ), 50 );

		this.setState( {
			is_scrolled: this.is_scrolled()
		} );
	},

	componentDidMount: function() {
		this.tbodyEl = document.getElementById( 'list-body' );
		this.setState( {
			is_scrolled: this.is_scrolled()
		} );

		if ( window.addEventListener ) {
			window.addEventListener( 'scroll', this.handleScroll, false );
		} else {
			window.attachEvent( 'onscroll', this.handleScroll );
		}
	},

	is_scrolled: function() {
		return this.tbodyEl.offsetTop < window.pageYOffset;
	},

	handleSelectPoint: function( event ) {
		var state;

		if ( this.state.selectedPoint && ! event.pointSticky && this.state.selectedPoint !== event.pointSticky ) {
			return;
		}

		state = {
			bounds: event.pointBounds,
			temperature: event.pointTemp
		}

		if ( event.pointSticky ) {
			state.selectedPoint = this.state.selectedPoint === event.pointSticky ? false : event.pointSticky;
		}

		this.setState( state );
	},

	render: function() {
		return (
			React.DOM.div( {className:this.state.is_scrolled ? "scroll" : ""}, 
				Loading( {done:this.state.done} ),
				PointList( {onUserSelectPoint:this.handleSelectPoint, points:this.state.points, selectedPoint:this.state.selectedPoint} ),
				Map( {bounds:this.state.bounds, temperature:this.state.temperature} )
			)
		);
	}
} );

React.renderComponent(
	App(null ),
	document.getElementById( 'app' )
);
