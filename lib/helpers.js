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
}

module.exports = helpers
