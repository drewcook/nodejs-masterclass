/**
 * A set of utility helper functions for various tasks
 */
const crypto = require('crypto')
const config = require('./config')
const https = require('https')
const querystring = require('querystring')

const helpers = {
	/**
	 * Create a test runner for running though our tests
	 * @param {} password
	 * @returns
	 */
	getANumber: () => 1,

	/**
	 * Hashes a given password for storage. Hashes with SHA256
	 * @param {string} password - The raw password to hash
	 */
	hash: password => {
		if (typeof password === 'string' && password.length > 0) {
			const hash = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex')
			return hash
		} else {
			return false
		}
	},
	/**
	 * Parses a JSON string to an object in all cases, without throwing
	 * @param {string} jsonString - A JSON string
	 */
	parseJsonStringToObject: jsonString => {
		try {
			const obj = JSON.parse(jsonString)
			return obj
		} catch {
			return {}
		}
	},
	/**
	 * Creates a string of random alphanumeric characters of a given length
	 * @param {number} length - The length of the random string to be created
	 */
	createRandomString: strLength => {
		const length = typeof strLength === 'number' && strLength > 0 ? strLength : false
		if (length) {
			const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'
			let str = ''
			for (let i = 1; i <= strLength; i++) {
				const randomIdx = Math.floor(Math.random() * possibleCharacters.length)
				str += possibleCharacters.charAt(randomIdx)
			}
			return str
		} else {
			return false
		}
	},
	/**
	 * Sends an HTTP request to the Twilio API to send an SMS message to a phone number
	 * @param {string} phone - The phone number to send a message to
	 * @param {string} msg - The message to send, must meet length requirements: 0 < msg <= 1600
	 * @param {function} cb - A callback function to invoke
	 */
	sendTwilioSms: (phone, msg, cb) => {
		// Validate parameters
		const phoneNumber = typeof phone === 'string' && phone.trim().length === 10 ? phone : false
		const message =
			typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600
				? msg.trim()
				: false
		if (phoneNumber && message) {
			// Configure the request payload
			let payload = {
				From: config.twilio.fromPhone,
				To: `+1${phoneNumber}`,
				Body: message,
			}
			// Stringify payload
			payload = querystring.stringify(payload)
			// Configure the request details
			const requestDetails = {
				protocol: 'https:',
				hostname: 'api.twilio.com',
				method: 'POST',
				path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
				auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': Buffer.byteLength(payload),
				},
			}
			// Create request
			const request = https.request(requestDetails, res => {
				// Grab status of sent request
				const status = res.statusCode
				// Callback successfully to caller if request went through
				if (status === 200 || status === 201) cb(false)
				else cb(`Creating request failed - status code returned as ${status}`)
			})
			// Bind to error event so it doesn't get thrown, prevent killing the thread
			request.on('error', err => {
				cb(err)
			})
			// Add payload to request
			request.write(payload)
			// End the request, send off to Twilio
			request.end()
		} else {
			cb('Given parameters were missing or invalid')
		}
	},
}

module.exports = helpers
