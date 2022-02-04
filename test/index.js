/**
 * Test Runner
 */

// Override the NODE_ENV variable - enforce we use the testing config
process.env.NODE_ENV = 'testing'

// Application logic for the test runner
const _app = {}

// Container for the tests
_app.tests = {}

// Add on unit tests as dependency
_app.tests.unit = require('./unit')
_app.tests.api = require('./api')

_app.countTests = () => {
	let counter = 0
	for (let key in _app.tests) {
		if (_app.tests.hasOwnProperty(key)) {
			const subtests = _app.tests[key]
			for (let testname in subtests) {
				if (subtests.hasOwnProperty(testname)) {
					counter++
				}
			}
		}
	}
	return counter
}

//  Run all the tests, collecting the errors and successess
_app.runTests = () => {
	const errors = []
	let successess = 0
	let counter = 0
	const limit = _app.countTests()
	for (let key in _app.tests) {
		if (_app.tests.hasOwnProperty(key)) {
			let subtests = _app.tests[key]
			for (let test in subtests) {
				if (subtests.hasOwnProperty(test)) {
					;(function () {
						let tmpTestname = test
						let testVal = subtests[test]
						// Call the test
						try {
							testVal(() => {
								// If it calls back without throwing, then it succeeded
								// Log it in green
								console.log('\x1b[32m%s\x1b[0m', tmpTestname)
								counter++
								successess++
								if (counter === limit) {
									_app.produceTestReport(limit, successess, errors)
								}
							})
						} catch (e) {
							// Test failed, capture and log it in red
							errors.push({
								name: test,
								error: e,
							})
							console.log('\x1b[31m%s\x1b[0m', tmpTestname)
							counter++
							if (counter === limit) {
								_app.produceTestReport(limit, successess, errors)
							}
						}
					})()
				}
			}
		}
	}
}

// Produce a test outcome report
_app.produceTestReport = (limit, successess, errors) => {
	console.log('')
	console.log('===============BEGIN TEST REPORTS===============')
	console.log('')
	console.log('Total Tests: ', limit)
	console.log('Pass: ', successess)
	console.log('Fail: ', errors.length)
	console.log('')

	// If there are errors, print them in detail
	if (errors.length > 0) {
		console.log('===============BEGIN ERROR DETAILS===============')
		console.log('')

		errors.forEach(err => {
			console.log('\x1b[31m%s\x1b[0m', err.name)
			console.log(err.error)
			console.log('')
		})
		console.log('')
		console.log('===============END ERROR DETAILS===============')
	}

	console.log('')
	console.log('===============END TEST REPORTS===============')
	// Kill process
	process.exit(0)
}

// Run the tests
_app.runTests()
