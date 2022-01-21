/**
 * Primary file for the background workers
 */
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')
const url = require('url')
const _data = require('./data')
const helpers = require('./helpers')

// Instantiate the server
let count = 0
const workers = {
	/**
	 * Initializes the background workers, fires once then every 60 seconds
	 */
	init: () => {
		// Execute all the checks immediately
		workers.gatherAllChecks()
		// Call teh loop so the checks will execute later on
		workers.loop()
	},
	/**
	 * Background worker set to gathers all checks every 60 seconds, this kicks off the monitoring process
	 */
	loop: () => {
		// Gather all checks every 60s
		setInterval(() => {
			workers.gatherAllChecks()
		}, 1000 * 60)
	},
	/**
	 * Gathers all checks by reading from datastore and validating them
	 */
	gatherAllChecks: () => {
		_data.list('checks', (err, checks) => {
			if (!err && checks && checks.length > 0) {
				checks.forEach(check => {
					// Read in the check data
					_data.read('checks', check, (err, originalCheckData) => {
						if (!err && originalCheckData) {
							// Pass it to check validator, and let the fn() continue or log errors as needed
							workers.validateCheckData(originalCheckData)
						} else {
							console.log('Error: Could not read the check data')
						}
					})
				})
			} else {
				console.log('Error: Could not find any checks to process')
			}
		})
	},
	/**
	 * Sanity check the check data, log errors as needed
	 * @param {object} checkData - The check data to validate
	 */
	validateCheckData: checkData => {
		const data = typeof checkData === 'object' && checkData !== null ? checkData : {}
		data.id =
			typeof checkData.id === 'string' && checkData.id.trim().length === 20
				? checkData.id.trim()
				: false
		data.phone =
			typeof checkData.userPhone === 'string' && checkData.userPhone.trim().length === 10
				? checkData.userPhone.trim()
				: false
		data.protocol =
			typeof checkData.protocol === 'string' && ['http', 'https'].includes(checkData.protocol)
				? checkData.protocol
				: false
		data.url =
			typeof checkData.url === 'string' && checkData.url.trim().length > 0
				? checkData.url.trim()
				: false
		data.method =
			typeof checkData.method === 'string' &&
			['get', 'post', 'put', 'delete'].includes(checkData.method)
				? checkData.method
				: false
		data.successCodes =
			typeof checkData.successCodes === 'object' &&
			checkData.successCodes instanceof Array &&
			checkData.successCodes.length > 0
				? checkData.successCodes
				: false
		data.timeoutSeconds =
			typeof checkData.timeoutSeconds === 'number' &&
			checkData.timeoutSeconds % 1 === 0 &&
			checkData.timeoutSeconds >= 1 &&
			checkData.timeoutSeconds <= 5
				? checkData.timeoutSeconds
				: false
		// Set the keys that may not be set (if the workers have never seen this check before)
		data.state =
			typeof checkData.state === 'string' && ['up', 'down'].includes(checkData.state)
				? checkData.state
				: 'down'
		data.lastChecked =
			typeof checkData.lastChecked === 'number' && checkData.lastChecked > 0
				? checkData.lastChecked
				: false
		// If all checks pass, pass data along to next step in process
		if (
			data.id &&
			data.phone &&
			data.protocol &&
			data.url &&
			data.method &&
			data.successCodes &&
			data.timeoutSeconds
		) {
			// Data is good, send along in the process
			workers.performCheck(data)
		} else {
			console.log('Error: Check data is invalid')
		}
	},
	/**
	 * Perform the check, send the data and outcome of the check process to the next step
	 * @param {object} check - The check DTO
	 */
	performCheck: check => {
		// Prepare initial outcome
		let outcome = {
			err: false,
			responseCode: false,
		}
		// Keep track if we've sent the outcome
		let outcomeSent = false
		// Parse the hostname and path out of the original check data
		const parsedUrl = url.parse(`${check.protocol}://${check.url}`, true)
		// Construct the request for API
		const requestDetails = {
			protocol: check.protocol + ':',
			hostname: parsedUrl.hostname,
			method: check.method.toUpperCase(),
			path: parsedUrl.path, // Using path, not pathname, because we want the query string
			timeout: check.timeoutSeconds * 1000,
		}

		// Instantiate the request object using either the http or https module
		let _moduleToUse = check.protocol === 'http' ? http : https
		const req = _moduleToUse.request(requestDetails, res => {
			// Update the check outcome and pass the data along
			const status = res.statusCode
			outcome.responseCode = status
			if (!outcomeSent) {
				workers.processCheckOutcome(check, outcome)
				outcomeSent = true
			}
		})
		// Bind to error event so it doesn't get thrown and kill the thread
		req.on('error', err => {
			// Update the check outcome and pass the data along
			outcome.error = {
				error: true,
				value: err,
			}
			if (!outcomeSent) {
				workers.processCheckOutcome(check, outcome)
				outcomeSent = true
			}
		})
		// Bind to timeout event
		req.on('timeout', err => {
			// Update the check outcome and pass the data along
			outcome.error = {
				error: true,
				value: 'timeout',
			}
			if (!outcomeSent) {
				workers.processCheckOutcome(check, outcome)
				outcomeSent = true
			}
		})
		// End the request
		req.end()
	},
	/**
	 * Process the check outcome, update the data as needed, trigger an alert if needed
	 * Special logic for accommodating a check that has never been tested before (don't alert on that)
	 * @param {object} check - The check data
	 * @param {object} outcome - The outcome data
	 */
	processCheckOutcome: (check, outcome) => {
		// Decide if check is considered up or down
		const state =
			!outcome.error && outcome.responseCode && check.successCodes.includes(outcome.responseCode)
				? 'up'
				: 'down'
		// Decide if alert is warranted - text when status has changed, from down -> up or up -> down
		const sendAlert = check.lastChecked && check.state !== state ? true : false
		// Update the check data
		const checkData = {
			...check,
			state,
			lastChecked: Date.now(),
		}
		// Save the updates
		_data.update('checks', check.id, checkData, err => {
			if (!err) {
				// Send the new check data to the next phase in the process if needed
				if (sendAlert) {
					workers.alertUserToStatusChange(checkData)
				} else {
					console.log('Check outcome unchanged, no alert needed')
				}
			} else {
				console.log('Error: Failed to save check data while processing check outcome')
			}
		})
	},
	/**
	 * Sends a message to user's phone about the change in their check status
	 * @param {object} check - The check data
	 */
	alertUserToStatusChange: check => {
		const message = `Alert: Your check for ${check.method.toUpperCase()} ${check.protocol}://${
			check.url
		} is currently ${check.state}`
		helpers.sendTwilioSms(check.userPhone, message, err => {
			if (!err) {
				console.log('Success: User was alerted to a status change in their check, via SMS', message)
			} else {
				console.log(
					'Error: Failed to send SMS to alert user who had a status change in their check',
				)
			}
		})
	},
}

module.exports = workers
