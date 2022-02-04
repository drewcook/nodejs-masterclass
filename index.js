/**
 * Primary file for the REST API
 */
'use strict'
const server = require('./lib/server')
const workers = require('./lib/workers')
const cli = require('./lib/cli')

// Declare application
const app = {
	init: () => {
		// Start the HTTP server
		server.init()
		// Start the background workers
		workers.init()

		// Start the CLI, but make sure it starts last
		setTimeout(() => {
			cli.init()
		}, 50)
	},
}

// Execute
app.init()

module.exports = app
