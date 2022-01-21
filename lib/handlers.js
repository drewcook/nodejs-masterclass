/**
 * Request handlers
 */

const apiHandlers = require('./apiHandlers')
const htmlHandlers = require('./htmlHandlers')

// Callback an HTTP status code and a payload object
const handlers = {
	// API handlers
	api: apiHandlers,
	// HTML handlers
	html: htmlHandlers,
	// Default not found handler
	notFound: (_, cb) => {
		cb(404)
	},
}

module.exports = handlers
