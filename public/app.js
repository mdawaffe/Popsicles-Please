/** @jsx React.DOM */

var Point = React.createClass( {
	render: function() {
		var heat = 'hot';
		if ( this.props.temperature < 50 ) {
			heat = 'cold';
		} else if ( this.props.temperature < 70 ) {
			heat = 'cool';
		} else if ( this.props.temperature < 80 ) {
			heat = 'nice';
		} else if ( this.props.temperature < 90 ) {
			heat = 'warm';
		}

		return (
			<tr className={heat}>
				<th scope="row">{this.props.city}</th>
				<td>{this.props.temperature} &deg;F</td>
			</tr>
		);
	}
} );

var PointList = React.createClass( {
	render: function() {
		var points = this.props.points.map( function( point ) {
			return <Point city={point.city} temperature={point.temperature} />;
		} );

		return (
			<table>
				<thead>
					<tr>
						<th scope="col">City</th>
						<th scope="col">Temperature</th>
					</tr>
				</thead>
				<tbody>
					{points}
				</tbody>
			</table>
		);
	}
} );

var Loading = React.createClass( {
	render: function() {
		return (
			<p className={ this.props.done ? "loading done" : "loading pending" }>Loading&hellip;</p>
		);
	}
} );

var App = React.createClass( {
	getInitialState: function() {
		return {
			points: [],
			done: false
		}
	},

	componentWillMount: function() {
		var _this = this;
		var socket = io.connect( 'http://127.0.0.1:3000/' );

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

	render: function() {
		return (
			<div>
				<Loading done={this.state.done} />
				<PointList points={this.state.points} />
			</div>
		);
	}
} );

React.renderComponent(
	<App />,
	document.getElementById( 'app' )
);
