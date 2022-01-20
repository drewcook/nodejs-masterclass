/**
 * A set of utility helper functions for various tasks
 */
const crypto = require('crypto')
const config = require('./config')

const helpers = {
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
			console.log(str)
			return str
		} else {
			return false
		}
	},
}

module.exports = helpers
