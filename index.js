/**
 * Create and configure an HTTP server
 */
const fs = require('fs')
const http = require('http')
const https = require('https')
const url = require('url')
const { StringDecoder } = require('string_decoder')
const config = require('./lib/config')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

// The server should respond to all requests with a string
// We reuse logic in unifiedServer so that we can apply it to both HTTP and HTTPS servers
const unifiedServer = (req, res) => {
	// Get url and parse it with query strings data
	const parsedUrl = url.parse(req.url, true)
	// Get path from the url, trim out all forward slashes
	const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
	// Get the HTTP request method
	const method = req.method.toLowerCase()
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
		const payload = helpers.parseJsonStringToObject(buffer)
		const data = {
			path,
			qs,
			method,
			headers,
			payload,
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

// Define a router for incoming requests to be routed to different request handlers based on the request path
const router = {
	ping: handlers.ping,
	users: handlers.users,
}
