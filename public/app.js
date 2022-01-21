/*
 * Frontend Logic for application
 */

const app = {}

// Frontend app config values
app.config = {
	sessionToken: false,
}

// AJAX client for the restful API
app.client = {
	/**
	 * Interface for making API calls, creates an XMLHttpRequest with provided config
	 * @param {object} headers - A list of headers to pass through for the request
	 * @param {string} path - The route to make a request to
	 * @param {string} method - An HTTP method
	 * @param {object} queryStringObject - Optional query string params for the request to use
	 * @param {object} payload - Optional payload for the request to use
	 * @param {function} callback - Optional callback to pass back a status code and response
	 */
	request: (headers, path, method, queryStringObject, payload, callback) => {
		// Set defaults
		const rHeaders = typeof headers === 'object' && headers !== null ? headers : {}
		const rPath = typeof path === 'string' ? path : '/'
		const rMethod =
			typeof method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].includes(method)
				? method.toUpperCase()
				: 'GET'
		const qs =
			typeof queryStringObject === 'object' && queryStringObject !== null ? queryStringObject : {}
		const rPayload = typeof payload === 'object' && payload !== null ? payload : {}
		const cb = typeof callback === 'function' ? callback : false

		// Add query strings to path
		let requestUrl = `${rPath}?`
		let counter = 0
		for (let key in qs) {
			if (qs.hasOwnProperty(key)) {
				counter++
				// If at least one qs param has already been added, prepend new ones with ampersand
				if (counter > 1) {
					requestUrl += '&'
				}
				// Add key and value
				requestUrl += `${key}=${qs[key]}`
			}
		}

		// Form the HTTP request as a JSON type
		const xhr = new XMLHttpRequest()
		xhr.open(rMethod, requestUrl, true)
		xhr.setRequestHeader('Content-Type', 'application/json')

		// For each header sent, add it to the request
		for (let headerKey in rHeaders) {
			if (headers.hasOwnProperty(headerKey)) {
				xhr.setRequestHeader(headerKey, headers[headerKey])
			}
		}

		// If there's a current session token, add it as a header
		if (app.config.sessionToken) {
			xhr.setRequestHeader('token', app.config.sessionToken.id)
		}

		// When request comes back, handle the response
		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				const statusCode = xhr.status
				let res = xhr.responseText
				// Callback if requested
				if (cb) {
					try {
						res = JSON.parse(res)
						cb(statusCode, res)
					} catch (e) {
						cb(statusCode, false)
					}
				}
			}
		}

		// Send the payload as JSON
		const payloadString = JSON.stringify(rPayload)
		xhr.send(payloadString)
	},
}
