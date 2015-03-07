# Overview

This module is a very simple unit test runner.

# Usage

Use [npm](https://www.npmjs.com/) to install the module as a command-line executable:

```
	sudo npm install -g pixl-unit
```

Then call it using `pixl-unit` and specify a path to your unit test file or directory:

```
	pixl-unit /path/to/your/unit/tests.js
```

You may specify multiple files and/or directories, separated by spaces.  If you specify directories, the script will scan the contents and execute all JS files within (one level deep only).

```
	pixl-unit /path/to/your/unit/test/dir/
```

## Command-Line Arguments

Specify command-line arguments using the format `--key value` and do this *after* any and all unit test files / directories.  The following command-line switches are supported:

| Argument | Default Value | Description |
| -------- | ------------- | ----------- |
| `threads` | 1 | The total number of threads to use when executing tests.  See warning below. | 
| `verbose` | 0 | Set this to `1` to enable verbose output to the console. | 
| `quiet` | 0 | Set this to `1` to suppress all output to the console. | 
| `color` | 1 | Enables or disables color output using the chalk module. | 
| `fatal` | 0 | Set this to `1` to exit immediately after the first assertion failure. | 
| `output` | "" | Set this to a file path to emit a JSON report (works with quiet mode). | 

Here is an example, which runs all the tests in `tests.js`, enables quiet mode, and generates a JSON report file:

```
	pixl-unit /path/to/tests.js --quiet --output /var/tmp/unit-results.json
```

Please be careful when increasing the `--threads` setting, beyond the default value of `1`.  This will cause multiple tests to run simultaneously.  If any of your tests rely on previous tests completing, this will not go well.

## Use in Modules

To use `pixl-unit` in your own npm module, first declare it in your `package.json` in the `devDependencies` section:

```javascript
	"devDepenendcies": {
		"pixl-unit": "*"
	}
```

Then add a test script command to your `scripts` section:

```javascript
	"scripts": {
		"test": "pixl-unit test/*.js"
	}
```

This example assumes you have a `test/` directory in your module containing one or more JS files containing unit tests compatible with `pixl-unit`.

Then you can simply type `npm test` to run your module's unit tests.

## Sample Output

`pixl-unit` outputs to the console by default, using the [chalk](https://www.npmjs.com/package/chalk) module for ANSI color.  It shows green checkmarks for passed tests, and red 'X's for failures.  Stats are summarized at the bottom.  You can also suppress this output and/or generate a JSON report file (see below).

```
	Simple Unit Test Runner v1.0
	Sat Mar 07 2015 12:50:11 GMT-0800 (PST)

	Args: {"threads":1,"verbose":0,"quiet":0,"color":1,"fatal":0,"output":""}
	Suites: ["/Users/jhuckaby/node_modules/pixl-unit/test.js"]

	Suite: /Users/jhuckaby/node_modules/pixl-unit/test.js
	✓ testTrue
	✓ testAsync
	✓ testExpect

	✓ OK - All tests passed

	Tests passed: 3 of 3 (100%)
	Tests failed: 0 of 3 (0%)
	Assertions:   5
	Test Suites:  1
	Time Elapsed: 0 seconds
```

Here is example JSON report:

```javascript
	{
	    "args": {
	        "color": 1,
	        "fatal": 0,
	        "output": "/var/tmp/joe.json",
	        "quiet": true,
	        "threads": 1,
	        "verbose": 0
	    },
	    "asserts": 5,
	    "elapsed": 0.108,
	    "failed": 0,
	    "files": [
	        "/Users/jhuckaby/node_modules/pixl-unit/test.js"
	    ],
	    "passed": 3,
	    "suites": 1,
	    "tests": 3,
	    "time_end": 1425762119.48,
	    "time_start": 1425762119.372,
	    "errors": []
	}
```

## Test Modules

Your test modules should be simple JS files containing tests, and optionally setup and teardown functions (described below).  Feel free to require any other modules you need at the top of your JS file.

You declare unit tests in your modules by exporting a `tests` array of functions.  The functions are executed in order from top to bottom, and support async tests by using a promise object.

```javascript
	exports.tests = [
		// function test1...
		// function test2...
	];
```

Each test function should have a name, and accept a single argument which is a promise:

```javascript
	function testTrue(test) {
		test.ok(true == true, 'Testing for true');
		test.done();
	}
```

The `test` promise has an assertion method called `ok` (`assert` also works).  This expects a boolean `true` for success, `false` for failure, and optionally accepts a message to be displayed upon failure.

Calling `test.done()` indicates that all the asserts have been called, and the test is complete.  This is useful because tests may be asynchronous, and finish in another pseudothread.  Example:

```javascript
	function testAsync(test) {
		setTimeout( function() {
			test.ok(true == true, 'Testing 100ms later');
			test.done();
		}, 100 );
	}
```

If you know exactly how many asserts will be called for a given test, you can call `expect()` at the beginning of the test, which sets an expectation for the assertion count.  If you then call `done()` without completing the asserts (or called too many) an error is raised.  Example use:

```javascript
	function testExpect(test) {
		// test the expect feature
		test.expect(3);
		test.ok( true, "Assertion 1 of 3" );
		test.ok( true, "Assertion 2 of 3" );
		test.ok( true, "Assertion 3 of 3" );
		test.done();
	}
```

## setUp and tearDown

You can optionally export `setUp` and/or `tearDown` functions from your module, which are called when the test is starting up, and shutting down, respectively.  These functions are passed a single callback which must be invoked to indicate that have finished their operations.

```javascript
	exports.setUp = function(callback) {
		// do some setup here
		callback();
	};
	
	exports.tearDown = function(callback) {
		// do some shutdown stuff here
		callback();
	};
```

# License

Copyright (c) 2015 Joseph Huckaby.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
