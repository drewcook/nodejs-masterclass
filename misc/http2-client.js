/**
 * HTTP2 Client
 * Allows for web sockets out of the box as compared to HTTP1
 * Run 'node misc/http2-server.js && node misc/http2-client' in the console
 */

const http2 = require('http2')

// Create client - connect to our http2 server
const client = http2.connect('http://localhost:6000')

// Create a request
const req = client.request({
	':path': '/',
})

// When a message is received, add the pieces of it together until you reach the end
let str = ''
req.on('data', chunk => {
	str += chunk
})

// When the message ends, log it out
req.on('end', () => {
	console.log(str)
})

// End the request
req.end()
