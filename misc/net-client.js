/**
 * Example TCP (Net) client
 * Connects to port 6000 and sends the word 'ping' to servers
 */

const net = require('net')

// Define the message to send
const outboundMsg = 'ping'

// Create the client
const client = net.createConnection({ port: 6000 }, () => {
	// Send the message
	client.write(outboundMsg)
})

// When server writes back, log what it says and kill the client
client.on('data', inboundMsg => {
	const msgStr = inboundMsg.toString()
	console.log(`I wrote ${outboundMsg} and they said ${msgStr}`)
	client.end()
})
