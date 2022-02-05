/**
 * Example TLS server
 * Listens to port 6000 and sends the word 'pong' to clients
 */

const tls = require('tls')
const fs = require('fs')
const path = require('path')

// Server options
const options = {
	key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
	cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
}

// Create the server
const server = tls.createServer(options, connection => {
	// Send the word 'pong'
	const outboundMsg = 'pong'
	connection.write(outboundMsg)

	// When client writes something, log it out
	connection.on('data', inboundMsg => {
		const msgStr = inboundMsg.toString()
		console.log(`I wrote ${outboundMsg} and they said ${msgStr}`)
	})
})

// Listen
server.listen(6000)
