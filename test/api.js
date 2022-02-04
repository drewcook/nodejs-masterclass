/**
 * These are the API integration tests
 */
const app = require('../index')
const assert = require('assert')
const http = require('http')
const config = require('../lib/config')

// Create a test holder
const api = {}

// Helpers
const helpers = {
	makeGetRequest: (path, cb) => {
		// Configure the request details
		const requestDetails = {
			protocol: 'http:',
			hostname: 'localhost',
			port: config.httpPort,
			method: 'GET',
			path,
			headers: {
				'Content-Type': 'application/json',
			},
		}
		// Send the request
		const req = http.request(requestDetails, res => {
			cb(res)
		})
		req.end()
	},
}

// The main init() should be able to run without throwing

api['app.init should start without throwing'] = done => {
	assert.doesNotThrow(() => {
		app.init(err => {
			done()
		})
	}, TypeError)
}

// Make request to ping
api['/ping should respond to GET with 200'] = done => {
	helpers.makeGetRequest('/ping', res => {
		assert.equal(res.statusCode, 200)
		done()
	})
}

// Make request to get users
api['/api/users should respond to GET with 400'] = done => {
	helpers.makeGetRequest('/api/users', res => {
		assert.equal(res.statusCode, 400)
		done()
	})
}

// Make request to random path
api['a random path should respond to GET with 404'] = done => {
	helpers.makeGetRequest('/does/not/exist', res => {
		assert.equal(res.statusCode, 404)
		done()
	})
}

module.exports = api
