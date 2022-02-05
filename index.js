/**
 * Primary file for the REST API
 */
'use strict'
const server = require('./lib/server')
const workers = require('./lib/workers')
const cli = require('./lib/cli')

// Declare application
const app = {
	init: cb => {
		// Start the HTTP server
		server.init()
		// Start the background workers
		workers.init()

		// Start the CLI, but make sure it starts last (dev only)
		if (process.env.NODE_ENV !== 'production') {
			setTimeout(() => {
				cli.init()
				cb()
			}, 50)
		}
	},
}

// Self invoking only if required directly
if (require.main === module) {
	// Execute
	app.init(() => {})
}

module.exports = app
