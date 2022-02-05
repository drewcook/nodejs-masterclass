/**
 * HTTP2 Server
 * Allows for web sockets out of the box as compared to HTTP1
 * Run 'node misc/http2-server.js && node misc/http2-client' in the console
 */

const http2 = require('http2')

// Init the server
const server = http2.createServer()

// On a stream (ws), send back hello world html
server.on('stream', (stream, headers) => {
	stream.respond({
		status: 200,
		'content-type': 'text/html',
	})
	stream.end('<html><body><p>Hello World</p></body></html>')
})

// Listen on 6000
server.listen(6000)
