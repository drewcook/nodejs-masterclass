/**
 * Example UDP client
 * Sending a message to a UDP server on port 6000
 */

const dgram = require('dgram')

// Create the client
const client = dgram.createSocket('udp4')

// Define the message and pull it into a buffer
const msgStr = 'This is a message'
const msgBuffer = Buffer.from(msgStr)

// Send off the message
client.send(msgBuffer, 6000, 'localhost', err => {
	client.close()
})
