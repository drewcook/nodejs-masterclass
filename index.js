/**
 * Primary file for the REST API
 */
const server = require('./lib/server')
const workers = require('./lib/workers')

// Declare application
const app = {
	init: () => {
		// Start the HTTP server
		server.init()
		// Start the background workers
		workers.init()
	},
}

// Execute
app.init()

module.exports = app
