module.exports = function(grunt) {

  //Load NPM tasks
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-jsdoc');


  //Task configutation
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      dist: {
        src: './index.js',
        dest: './browser/bitmark-lib.min.js'
      }
    },
    mochaTest: {
      options: {
        reporter: 'spec',
      },
      src: ['test/**/*.js'],
    },
    jsdoc : {
      dist : {
        src: ['lib/*.js', 'test/*.js'],
        options: {
          destination: 'doc'
        }
      }
    }
  });
  grunt.registerTask('test', ['mochaTest']);
};