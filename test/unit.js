/**
 * Unit tests
 */
const helpers = require('../lib/helpers')
const assert = require('assert')
const logs = require('../lib/logs')
const exampleThrow = require('../lib/exampleThrow')

//  Holder for tests
const unit = {}

// getANumber()
unit['helpers.getANumber should return a number'] = done => {
	const val = helpers.getANumber()
	assert.equal(typeof val, 'number')
	done()
}

unit['helpers.getANumber should return 1'] = done => {
	const val = helpers.getANumber()
	assert.equal(val, 1)
	done()
}

unit['helpers.getANumber should return 2'] = done => {
	const val = helpers.getANumber()
	assert.equal(val, 2)
	done()
}

// Logs
unit['logs.list should callback a false error and an array of log names'] = done => {
	logs.list(true, (err, filenames) => {
		assert.equal(err, false)
		assert.ok(filenames instanceof Array)
		assert.ok(filenames.length > 1)
		done()
	})
}

unit[
	'logs.truncate should not throw if the logID does not exist, should callback instead'
] = done => {
	assert.doesNotThrow(() => {
		logs.truncate('I do not exist', err => {
			assert.ok(err)
			done()
		})
	}, TypeError)
}

unit['exampleThrow should not throw when called'] = done => {
	assert.doesNotThrow(() => {
		exampleThrow()
		done()
	}, TypeError)
}

module.exports = unit
