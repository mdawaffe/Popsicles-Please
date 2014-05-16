module.exports = function( grunt ) {
	grunt.initConfig( {
		react: {
			main: {
				expand: true,
				cwd: 'src/',
				src: [ '*.jsx' ],
				dest: 'build/',
				ext: '.js'
			}
		},

		copy: {
			main: {
				expand: true,
				cwd: 'src/',
				src: [ '*.css', '*.html' ],
				dest: 'build/'
			}
		},

		watch: {
			react: {
				files: [ 'src/*.jsx' ], /* */
				tasks: [ 'react' ],
			},

			static: {
				files: [ 'src/*.css', 'src/*.html' ], /* */
				tasks: [ 'copy' ],
			}
		},
	} );

	grunt.loadNpmTasks( 'grunt-react' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	grunt.registerTask( 'default', [ 'react', 'copy' ] );
};
