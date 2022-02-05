/**
 * Example TLS client
 * Connects to port 6000 and sends the word 'ping' to servers
 */

const tls = require('tls')
const fs = require('fs')
const path = require('path')

// Because we are using self signed certs, we must pass them along with our client requests, this is only the case for SSLs
// Server options
const options = {
	ca: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
}

// Define the message to send
const outboundMsg = 'ping'

// Create the client
const client = tls.connect(6000, options, () => {
	// Send the message
	client.write(outboundMsg)
})

// When server writes back, log what it says and kill the client
client.on('data', inboundMsg => {
	const msgStr = inboundMsg.toString()
	console.log(`I wrote ${outboundMsg} and they said ${msgStr}`)
	client.end()
})
