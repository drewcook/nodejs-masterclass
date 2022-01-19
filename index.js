/**
 * Create and configure an HTTP server
 */

const http = require('http')
const url = require('url')
const { StringDecoder } = require('string_decoder')
const config = require('./config')

// The server should respond to all requests with a string
const server = http.createServer((req, res) => {
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
})

// Start the server and listen on port 3000
server.listen(config.port, () => {
	console.log(`Server is listening on port ${config.port} in ${config.name} mode...`)
})

// Define our request handlers for our router
// Callback an HTTP status code and a payload object
const handlers = {}
handlers.sample = (data, cb) => {
	cb(406, { name: 'sample handler' })
}
handlers.notFound = (data, cb) => {
	cb(404)
}

// Define a router for incoming requests to be routed to different request handlers based on the request path
const router = {
	sample: handlers.sample,
}
