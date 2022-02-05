/**
 * Example UDP server
 * Creating a UDP datagram server listening on 6000
 */

const dgram = require('dgram')

// Creating a server
const server = dgram.createSocket('udp4')

server.on('message', (msgBuffer, sender) => {
	// Do something with incoming message or sender
	const msgStr = msgBuffer.toString()
	console.log(msgStr)
})

// Bind to 6000
server.bind(6000)
