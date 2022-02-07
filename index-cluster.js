/**
 * Primary file for the REST API
 */
'use strict'
const server = require('./lib/server')
const workers = require('./lib/workers')
const cli = require('./lib/cli')
const cluster = require('cluster')
const os = require('os')

// Create a cluster to spread the app across all the CPUs availables
// We don't want our CLI running on all cores, we only need one thread for this
// We don't want our workers to run on all cores, that will be expensive
// We only want our server to be spread out, so we can spread the load for requests

// Declare application
const app = {
	init: cb => {
		// Determine if server is the master thread or a fork
		// If we're on the master thread, start the background workers and the CLI
		if (cluster.isMaster) {
			// Start the background workers
			workers.init()

			// Start the CLI because we only need it on one thread, but make sure it starts last
			if (process.env.NODE_ENV !== 'production') {
				setTimeout(() => {
					cli.init()
					cb()
				}, 50)
			}

			// Fork the process for each # of cores on the CPU
			const cores = os.cpus().length
			for (let i = 0; i < cores; i++) {
				cluster.fork()
			}
		} else {
			// If we're not on the master thread, start the HTTP server
			server.init()
		}
	},
}

// Self invoking only if required directly
if (require.main === module) {
	// Execute
	app.init(() => {})
}

module.exports = app
