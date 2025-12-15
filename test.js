// Sample unit tests for pixl-unit
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

const assert = require('node:assert/strict');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
	setUp: function (callback) {
		// always called before tests start
		callback();
	},
	
	tests: [
		
		function testTrue(test) {
			test.ok(true == true, 'Testing for true');
			test.done();
		},
		
		function testTimeout(test) {
			setTimeout( function() {
				test.ok(true == true, 'Testing 100ms later');
				test.done();
			}, 100 );
		},
		
		function testTimeout(test) {
			test.timeout( 200 ); // 200ms max time
			
			setTimeout( function() {
				test.ok(true == true, 'Testing 100ms later');
				test.done();
			}, 100 );
		},
		
		function testExpect(test) {
			// test the expect feature
			test.expect(3);
			test.ok( true, "Assertion 1 of 3" );
			test.ok( true, "Assertion 2 of 3", { additional_data: 12345 } );
			test.ok( true, "Assertion 3 of 3" );
			test.done();
		},
		
		async function testAsync(test) {
			// true async function
			// pixl-unit will wait for promise to resolve
			// no need to call test.done(), and we can also use node's assert here
			await sleep(100);
			assert.strictEqual(1, 1);
		}
		
	], // tests array
	
	tearDown: function (callback) {
		// always called right before shutdown
		callback();
	}
};
