/**
 * Example TCP (Net) server
 * Listens to port 6000 and sends the word 'pong' to clients
 */

const net = require('net')

// Create the server
const server = net.createServer(connection => {
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
