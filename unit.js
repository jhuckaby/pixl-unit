#!/usr/bin/env node

// Simple Unit Test Runner
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require("fs");
var path = require("path");
var util = require("util");

var async = require("async");
var chalk = require("chalk");
var Args = require("pixl-args");
var Tools = require("pixl-tools");

// shift files off beginning of arg array
var argv = JSON.parse( JSON.stringify(process.argv.slice(2)) );
var paths = [];
while (argv.length && !argv[0].match(/^\-/)) {
	paths.push( path.resolve( argv.shift() ) );
}

// now parse rest of cmdline args, if any
var args = new Args( argv, {
	threads: 1,
	verbose: 0,
	quiet: 0,
	color: 1,
	fatal: 0,
	output: ''
} );
args = args.get(); // simple hash

// color support?
if (!args.color) chalk.enabled = false;

// resolve dirs to files
var files = [];
for (var idx = 0, len = paths.length; idx < len; idx++) {
	var p = paths[idx].replace(/\/$/, '');
	var stats = fs.statSync( p );
	if (stats.isFile()) files.push( p );
	else if (stats.isDirectory()) {
		var filenames = fs.readdirSync( p );
		for (var idy = 0, ley = filenames.length; idy < ley; idy++) {
			var filename = filenames[idy];
			if (filename.match(/\.js$/i)) files.push( p + '/' + filename );
		}
	} // dir
} // foreach path

var print = function(msg) {
	// print message to console
	if (!args.quiet) process.stdout.write(msg);
};
var verbose = function(msg) {
	// print only in verbose mode
	if (args.verbose) print(msg);
};
var pct = function(amount, total) {
	// printable percent number
	if (!amount) amount = 0;
	if (!total) total = 1;
	return '' + Math.floor( (amount / total) * 100 ) + '%';
};

print("\n" + chalk.bold.magenta("Simple Unit Test Runner v1.0") + "\n");
print( chalk.gray((new Date()).toLocaleString()) + "\n" );

print("\n" + chalk.gray("Args: " + JSON.stringify(args)) + "\n");
print( chalk.gray("Suites: " + JSON.stringify(files)) + "\n");

var stats = {
	tests: 0,
	asserts: 0,
	passed: 0,
	failed: 0,
	errors: [],
	time_start: Tools.timeNow()
};

// iterate over files
async.eachSeries( files, 
	function(file, callback) {
		print("\n" + chalk.bold.yellow("Suite: " + file) + "\n");
		
		// load js file and grab tests
		var suite = require( path.resolve(file) );
		
		// stub out setUp and tearDown if not defined
		if (!suite.setUp) suite.setUp = function(callback) { callback(); };
		if (!suite.tearDown) suite.tearDown = function(callback) { callback(); };
		
		// setUp
		suite.setUp( function() {
		
			// execute tests
			async.eachLimit( suite.tests, args.threads, 
				function(test_func, callback) {
					// execute single test
					stats.tests++;
					var test_name = test_func.name ? test_func.name : ("UnnamedTest" + stats.tests);
					
					var test = {
						expected: 0,
						asserted: 0,
						passed: 0,
						failed: 0,
						
						expect: function(num) {
							this.expected = num;
						},
						assert: function(fact, msg) {
							this.asserted++;
							if (fact) {
								this.passed++;
								verbose('.');
							}
							else {
								this.failed++;
								verbose("F\n");
								if (!msg) msg = "(No message)";
								print( chalk.bold.red("Assert Failed: " + file + ": " + test_name + ": " + msg) + "\n" );
								stats.errors.push( "Assert Failed: " + file + ": " + test_name + ": " + msg );
								if (args.fatal) process.exit(1);
							}
						},
						done: function() {
							stats.asserts += this.asserted;
							
							if (this.expected && (this.asserted != this.expected)) {
								// wrong number of assertions
								this.failed++;
								verbose("F\n");
								var msg = "Error: Wrong number of assertions: " + file + ": " + test_name + ": " + 
									"Expected " + this.expected + ", Got " + this.asserted + ".";
								print( chalk.bold.red(msg) + "\n" );
								stats.errors.push( msg );
								if (args.fatal) process.exit(1);
							}
							if (!this.failed) {
								// test passed
								stats.passed++;
								print( chalk.bold.green("✓ " + test_name) + "\n" );
							}
							else {
								// test failed
								stats.failed++;
								print( chalk.bold.red("X " + test_name) + "\n" );
							}
							callback();
						} // done
					}; // test object
					
					// convenience, to better simulate nodeunit
					test.ok = test.assert;
					
					// invoke test
					verbose("Running test: " + test_name + "...\n");
					test_func.apply( suite, [test] );
				},
				function(err) {
					 // all tests complete in suite
					 suite.tearDown( function() {
					 	callback();
					 } ); // tearDown
				} // all tests complete
			); // each test
			
		} ); // setUp
	},
	function(err) {
		// all suites complete
		stats.time_end = Tools.timeNow();
		stats.elapsed = stats.time_end - stats.time_start;
		stats.suites = files.length;
		stats.files = files;
		stats.args = args;
		
		print("\n");
		
		if (!stats.failed) {
			// all tests passed
			print( chalk.bold.green("✓ OK - All tests passed") + "\n" );
		}
		else {
			print( chalk.bold.red("X - Errors occurred") + "\n" );
			process.exitCode = 1;
		}
		
		// more stats
		var pass_color = stats.failed ? chalk.bold.yellow : chalk.bold.green;
		var fail_color = stats.failed ? chalk.bold.red : chalk.bold.gray;
		
		print("\n");
		print( pass_color("Tests passed: " + stats.passed + " of " + stats.tests + " (" + pct(stats.passed, stats.tests) + ")") + "\n" );
		print( fail_color("Tests failed: " + stats.failed + " of " + stats.tests + " (" + pct(stats.failed, stats.tests) + ")") + "\n" );
		print( chalk.gray("Assertions:   " + stats.asserts) + "\n" );
		print( chalk.gray("Test Suites:  " + stats.suites) + "\n" );
		print( chalk.gray("Time Elapsed: " + Math.floor(stats.elapsed) + " seconds") + "\n" );
		print("\n");
		
		// json file output
		if (args.output) {
			fs.writeFileSync( args.output, JSON.stringify(stats) );
		}
	}
);
