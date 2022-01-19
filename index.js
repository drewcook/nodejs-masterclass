/**
 * Create and configure an HTTP server
 */
const fs = require('fs')
const http = require('http')
const https = require('https')
const url = require('url')
const { StringDecoder } = require('string_decoder')
const config = require('./config')
const _data = require('./lib/data')

// TESTING OUR DATASTORE - CRUD
_data.create('test', 'example', { name: 'Drew', isHealthy: false }, err => {
	if (err) console.error('An error occurred while creating a new file:\n', err)
})
_data.read('test', 'example', (err, data) => {
	if (err && !data) console.error('An error occurred while reading from a file:\n', err)
	if (data) console.log('Content from file:\n', data)
})
_data.update('test', 'example', { age: 32 }, err => {
	if (err) console.error('An error occurred while updating an existing file:\n', err)
})
_data.delete('test', 'example', err => {
	if (err) console.error('An error occurred while deleting a file:\n', err)
})

// The server should respond to all requests with a string
// We reuse logic in unifiedServer so that we can apply it to both HTTP and HTTPS servers
const unifiedServer = (req, res) => {
	// Get url and parse it with query strings data
	const parsedUrl = url.parse(req.url, true)
	// Get path from the url, trim out all forward slashes
	const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
	// Get the HTTP request method
	const method = req.method.toUpperCase()
	// Get the query strings
	const qs = parsedUrl.query
	// Get the HTTP headers
	const { headers } = req
	// Get the payload if there is any
	// Use string decoder to capture stream data as UTF-8 characters and append into a buffer as it streams in
	const decoder = new StringDecoder('utf-8')
	let buffer = ''
	req.on('data', data => {
		buffer += decoder.write(data)
	})
	req.on('end', () => {
		buffer += decoder.end()

		// Route the request to the appropriate handler
		const handler = typeof router[path] !== 'undefined' ? router[path] : handlers.notFound

		// Construct payload to send
		const data = {
			path,
			qs,
			method,
			headers,
			payload: buffer,
		}

		handler(data, (statusCode, payload) => {
			// Use the status code called back by the handler or default to 200
			const resStatus = typeof statusCode === 'number' ? statusCode : 200
			// Use the payload called back by the handler or default to an empty object
			let resPayload = typeof payload === 'object' ? payload : {}
			// Convert the payload to string
			resPayload = JSON.stringify(resPayload)

			// Send the response with status and payload as JSON
			res.setHeader('Content-Type', 'application/json')
			res.writeHead(resStatus)
			res.end(resPayload)

			// Log the request path
			console.log(`A ${method} request was made to ${path}`)
			console.log('Returned a response:', resStatus, resPayload)
		})
	})
}

// Start up the HTTP server
const httpServer = http.createServer(unifiedServer)
httpServer.listen(config.httpPort, () => {
	console.log(`HTTP server is listening on port ${config.httpPort} in ${config.name} mode...`)
})

// Start up the HTTPS server
const httpsServerOptions = {
	key: fs.readFileSync('./https/key.pem'),
	cert: fs.readFileSync('./https/cert.pem'),
}
const httpsServer = https.createServer(httpsServerOptions, unifiedServer)
httpsServer.listen(config.httpsPort, () => {
	console.log(`HTTPS server is listening on port ${config.httpsPort} in ${config.name} mode...`)
})

// Define our request handlers for our router
// Callback an HTTP status code and a payload object
const handlers = {
	// Ping handler, useful for monitoring that the API is up
	ping: (data, cb) => {
		cb(200)
	},
	// Default not found handler
	notFound: (data, cb) => {
		cb(404)
	},
}

// Define a router for incoming requests to be routed to different request handlers based on the request path
const router = {
	ping: handlers.ping,
}
