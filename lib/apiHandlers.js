/**
 * API-specific route handlers
 */

const _data = require('./data')
const helpers = require('./helpers')
const config = require('./config')
const _url = require('url')
const dns = require('dns')
const _performance = require('perf_hooks').performance
const util = require('util')
const debug = util.debuglog('performance')

// The subhandlers for each resource (GET,POST,PUT,DELETE)
const subHandlers = {
	_users: {
		// Users - get
		// Required data: phone
		// Optional data: none
		// Authenticated
		get: (data, cb) => {
			// Check that the phone number is valid
			const { headers, qs } = data
			const phone =
				typeof qs.phone === 'string' && qs.phone.trim().length === 10 ? qs.phone.trim() : false
			if (!phone) {
				cb(400, { error: `Missing or invalid required field - phone` })
			} else {
				// Get the token from the headers
				const token = typeof headers.token === 'string' ? headers.token : false
				// Verify that the given token is valid for the phone number
				apiHandlers.tokens.verifyToken(token, phone, isValid => {
					if (isValid) {
						// Look up user
						_data.read('users', phone, (err, userData) => {
							if (!err && userData) {
								// Remove hashed password from user before returning it to requester
								delete userData.hashedPassword
								cb(200, userData)
							} else {
								cb(404, { error: `Could not find user with phone number of ${phone}` })
							}
						})
					} else {
						cb(403, { error: 'Missing required token in header, or token is invalid' })
					}
				})
			}
		},
		// Users - post
		// Required data: firstName, lastName, phone, password, tosAgreement
		// Optional data: none
		post: (data, cb) => {
			/*
      Check that all required fields are filled out, set up some basic requirements
      - firstName: Must be non-empty string
      - lastName: Must be non-empty string
      - phone: Must be a 10 digit string
      - password - Must be a non-empty string
      - tosAgreement: Must be true, boolean
      */
			const { payload } = data
			const firstName =
				typeof payload.firstName === 'string' && payload.firstName.trim().length > 0
					? payload.firstName.trim()
					: false
			const lastName =
				typeof payload.lastName === 'string' && payload.lastName.trim().length > 0
					? payload.lastName.trim()
					: false
			const phone =
				typeof payload.phone === 'string' && payload.phone.trim().length === 10
					? payload.phone.trim()
					: false
			const password =
				typeof payload.password === 'string' && payload.password.trim().length > 0
					? payload.password.trim()
					: false
			const tosAgreement =
				typeof payload.tosAgreement === 'boolean' && payload.tosAgreement === true ? true : false
			// Now, verify all our payload against our requirements, if any field fails, send back an error
			if (firstName && lastName && phone && password && tosAgreement) {
				// Verify that the phone number isn't already in use by another user
				// Read from filesystem datastore and look for file with users/{phone}.json
				_data.read('users', phone, (err, data) => {
					if (!err && data) {
						cb(400, { error: `User with phone number of ${phone} already exists` })
					} else {
						// Hash the password prior to storage
						const hashedPassword = helpers.hash(password)
						if (hashedPassword) {
							// Create the user DTO
							const newUser = {
								firstName,
								lastName,
								phone,
								hashedPassword,
								tosAgreement,
							}
							// Store the user
							_data.create('users', phone, newUser, err => {
								if (err) {
									console.error(err)
									cb(500, { error: 'Could not create the new user' })
								} else {
									cb(200)
								}
							})
						} else {
							cb(500, { error: "Could not hash the user's password" })
						}
					}
				})
			} else {
				cb(400, {
					error: 'Missing required field(s) - firstName, lastName, phone, password, tosAgreement',
				})
			}
		},
		// Users - put
		// Required data: phone
		// Optional data: firstName, lastName, password (at least one)
		// Authenticated
		put: (data, cb) => {
			const { headers, payload } = data
			// Required field
			const phone =
				typeof payload.phone === 'string' && payload.phone.trim().length === 10
					? payload.phone.trim()
					: false
			// Optional fields
			const firstName =
				typeof payload.firstName === 'string' && payload.firstName.trim().length > 0
					? payload.firstName.trim()
					: false
			const lastName =
				typeof payload.lastName === 'string' && payload.lastName.trim().length > 0
					? payload.lastName.trim()
					: false
			const password =
				typeof payload.password === 'string' && payload.password.trim().length > 0
					? payload.password.trim()
					: false

			if (phone) {
				// continue
				if (firstName || lastName || password) {
					// Get the token from the headers
					const token = typeof headers.token === 'string' ? headers.token : false
					// Verify that the given token is valid for the phone number
					apiHandlers.tokens.verifyToken(token, phone, isValid => {
						if (isValid) {
							// Lookup the user
							_data.read('users', phone, (err, userData) => {
								if (!err && userData) {
									// Update fields
									if (firstName) userData.firstName = firstName
									if (lastName) userData.lastName = lastName
									if (password) userData.hashedPassword = helpers.hash(password)
									// Store the new data for given user
									_data.update('users', phone, userData, err => {
										if (!err) {
											cb(200)
										} else {
											console.log(err)
											cb(500, { error: 'Could not update the user' })
										}
									})
								} else {
									cb(400, { error: `Could not find user with phone number of ${phone}` })
								}
							})
						} else {
							cb(403, { error: 'Missing required token in header, or token is invalid' })
						}
					})
				} else {
					cb(400, {
						error: 'Missing at least one optional field - firstName, lastName, or password',
					})
				}
			} else {
				cb(400, { error: 'Missing required field - phone' })
			}
		},
		// Users - delete
		// Required data: phone
		// Optional data: none
		// Authenticated
		delete: (data, cb) => {
			// Check that the phone number is valid
			const { headers, qs } = data
			const phone =
				typeof qs.phone === 'string' && qs.phone.trim().length === 10 ? qs.phone.trim() : false
			if (!phone) {
				cb(400, { error: `Missing or invalid required field - phone` })
			} else {
				// Get the token from the headers
				const token = typeof headers.token === 'string' ? headers.token : false
				// Verify that the given token is valid for the phone number
				apiHandlers.tokens.verifyToken(token, phone, isValid => {
					if (isValid) {
						// Look up user
						_data.read('users', phone, (err, userData) => {
							if (!err && userData) {
								// Delete the user
								_data.delete('users', phone, err => {
									if (!err) {
										// Delete each of the checks associated with the user
										const userChecks =
											typeof userData.checks === 'object' && userData.checks instanceof Array
												? userData.checks
												: []
										const checksToDelete = userChecks.length
										if (checksToDelete > 0) {
											let checksDeleted = 0
											let deleteErrors = false
											userChecks.forEach(checkId => {
												// Delete the check
												_data.delete('checks', checkId, err => {
													if (err) deleteErrors = true
													checksDeleted++
													if (checksDeleted === checksToDelete) {
														if (!deleteErrors) {
															cb(200)
														} else {
															cb(500, {
																error:
																	"Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully.",
															})
														}
													}
												})
											})
										} else {
											cb(200)
										}
									} else {
										cb(500, { error: 'Could not delete the user' })
									}
								})
							} else {
								cb(400, { error: `Could not find user with phone number of ${phone}` })
							}
						})
					} else {
						cb(403, { error: 'Missing required token in header, or token is invalid' })
					}
				})
			}
		},
	},
	_tokens: {
		// Tokens - get
		// Required data: id
		// Optional data: none
		get: (data, cb) => {
			// Check that id provided is valid
			const { qs } = data
			const id = typeof qs.id === 'string' && qs.id.trim().length === 20 ? qs.id.trim() : false
			if (!id) {
				cb(400, { error: `Missing or invalid required field - id` })
			} else {
				// Look up user
				_data.read('tokens', id, (err, tokenData) => {
					if (!err && tokenData) {
						cb(200, tokenData)
					} else {
						cb(404, { error: `Could not find token with id of ${id}` })
					}
				})
			}
		},
		// Tokens - post
		// Required data: phone, password
		// Optional data: none
		post: (data, cb) => {
			_performance.mark('entered function')
			const { payload } = data
			const phone =
				typeof payload.phone === 'string' && payload.phone.trim().length === 10
					? payload.phone.trim()
					: false
			const password =
				typeof payload.password === 'string' && payload.password.trim().length > 0
					? payload.password.trim()
					: false

			_performance.mark('inputs validated')
			if (phone && password) {
				// Look up user with given phone
				_performance.mark('begin user lookup')
				_data.read('users', phone, (err, userData) => {
					_performance.mark('user lookup complete')
					if (!err && userData) {
						// Hash the sent password and compare against the password stored for the user
						_performance.mark('begin password hashing')
						const hashedPassword = helpers.hash(password)
						_performance.mark('password hashing complete')
						if (hashedPassword === userData.hashedPassword) {
							// If valid, create a new token with a random name, set expiry for 1 hour in future
							_performance.mark('create data for token')
							const tokenId = helpers.createRandomString(20)
							const expires = Date.now() + 1000 * 60 * 60
							const token = {
								id: tokenId,
								phone,
								expires,
							}
							// Store the token
							_performance.mark('begin storing token')
							_data.create('tokens', tokenId, token, err => {
								_performance.mark('storing token complete')

								// Gather all the measurements
								_performance.measure(
									'Beginning to end',
									'entered function',
									'storing token complete',
								)
								_performance.measure(
									'Validating user input',
									'entered function',
									'inputs validated',
								)
								_performance.measure('User lookup', 'begin user lookup', 'user lookup complete')
								_performance.measure(
									'Password hashing',
									'begin password hashing',
									'password hashing complete',
								)
								_performance.measure(
									'Token data creation',
									'create data for token',
									'begin storing token',
								)
								_performance.measure(
									'Token storing',
									'begin storing token',
									'storing token complete',
								)

								// Log out all measurements
								// TODO: .getEntriesByType is not a function
								// const measurements = _performance.getEntriesByType('measure')
								// measurements.forEach(m => debug('\x1b[33m%s\x1b[0m', `${m.name}: ${m.duration}`))

								if (!err) {
									cb(200, token)
								} else {
									cb(500, { error: 'Could not create the new token' })
								}
							})
						} else {
							cb(400, { error: "Password provided did not match the specified user's password" })
						}
					} else {
						cb(400, { error: `Could not find user with phone number of ${phone}` })
					}
				})
			} else {
				cb(400, { error: 'Missing required field(s) - phone, password' })
			}
		},
		// Tokens - put
		// Required data: id, extend
		// Optional data: none
		put: (data, cb) => {
			// Allow users to extend expiration time, but not provide a particular expiry, hardset to 1 hour to extend
			const { payload } = data
			const id =
				typeof payload.id === 'string' && payload.id.trim().length === 20
					? payload.id.trim()
					: false
			const extend = typeof payload.extend === 'boolean' && payload.extend === true ? true : false
			if (id && extend) {
				// Look up token
				_data.read('tokens', id, (err, tokenData) => {
					if (!err && tokenData) {
						// Check to make sure the token isn't already expired
						if (tokenData.expires > Date.now()) {
							// Set the expiration 1 hour from now
							tokenData.expires = Date.now() + 1000 * 60 * 60
							// Store the new updates
							_data.update('tokens', id, tokenData, err => {
								if (!err) {
									cb(200)
								} else {
									cb(500, { error: 'Could not update the tokens expiration' })
								}
							})
						} else {
							cb(400, { error: 'The token has already expired and cannot be extended' })
						}
					} else {
						cb(400, { error: `Could not find token with id of ${id}` })
					}
				})
			} else {
				cb(400, { error: 'Missing or invalid field(s) - id, extend' })
			}
		},
		// Tokens - delete
		// Required data: id
		// Optional data: none
		delete: (data, cb) => {
			// Check that the phone number is valid
			const { qs } = data
			const id = typeof qs.id === 'string' && qs.id.trim().length === 20 ? qs.id.trim() : false
			if (!id) {
				cb(400, { error: `Missing or invalid required field - id` })
			} else {
				// Look up token
				_data.read('tokens', id, (err, tokenData) => {
					if (!err && tokenData) {
						_data.delete('tokens', id, err => {
							if (!err) {
								cb(200)
							} else {
								cb(500, { error: 'Could not delete the token' })
							}
						})
					} else {
						cb(400, { error: `Could not find token with id of ${id}` })
					}
				})
			}
		},
	},
	_checks: {
		// Checks - get
		// Required data: id
		// Optional data: none
		get: (data, cb) => {
			// Check that id provided is valid
			const { headers, qs } = data
			const id = typeof qs.id === 'string' && qs.id.trim().length === 20 ? qs.id.trim() : false
			if (!id) {
				cb(400, { error: `Missing or invalid required field - id` })
			} else {
				// Look up check
				_data.read('checks', id, (err, checkData) => {
					if (!err && checkData) {
						// Get the token from the headers
						const token = typeof headers.token === 'string' ? headers.token : false
						// Verify that the given token is valid for the phone number
						apiHandlers.tokens.verifyToken(token, checkData.userPhone, isValid => {
							if (isValid) {
								cb(200, checkData)
							} else {
								cb(403)
							}
						})
					} else {
						cb(404, { error: `Could not find check with id of ${id}` })
					}
				})
			}
		},
		// Checks - post
		// Required data: protocol, url, method, successCodes, timeoutSeconds
		// Optional data: none
		post: (data, cb) => {
			// Validate inputs
			const { headers, payload } = data
			const protocol =
				typeof payload.protocol === 'string' && ['http', 'https'].includes(payload.protocol)
					? payload.protocol
					: false
			const url =
				typeof payload.url === 'string' && payload.url.trim().length > 0
					? payload.url.trim()
					: false
			const method =
				typeof payload.method === 'string' &&
				['get', 'post', 'put', 'delete'].includes(payload.method)
					? payload.method
					: false
			const successCodes =
				typeof payload.successCodes === 'object' &&
				payload.successCodes instanceof Array &&
				payload.successCodes.length > 0
					? payload.successCodes
					: false
			const timeoutSeconds =
				typeof payload.timeoutSeconds === 'number' &&
				payload.timeoutSeconds % 1 === 0 &&
				payload.timeoutSeconds >= 1 &&
				payload.timeoutSeconds <= 5
					? payload.timeoutSeconds
					: false

			if (protocol && url && method && successCodes && timeoutSeconds) {
				// Get the token from the headers
				const token = typeof headers.token === 'string' ? headers.token : false
				// Look up the user by reading the token
				_data.read('tokens', token, (err, tokenData) => {
					if (!err && tokenData) {
						const userPhone = tokenData.phone
						// Look up the user
						_data.read('users', userPhone, (err, userData) => {
							if (!err && userData) {
								const userChecks =
									typeof userData.checks === 'object' && userData.checks instanceof Array
										? userData.checks
										: []
								// Verify that user has less than max checks per user (from config)
								if (userChecks.length < config.maxChecks) {
									// Verify that the URL given has DNS entries (and therefore can resolve)
									const parsedUrl = _url.parse(`${protocol}://${url}`, true)
									const hostName =
										typeof parsedUrl.hostname === 'string' && parsedUrl.hostname.length > 0
											? parsedUrl.hostname
											: false
									dns.resolve(hostName, (err, records) => {
										if (!err && records) {
											// Create a random id for the check
											const checkId = helpers.createRandomString(20)
											// Create the check object and include the user's phone
											const check = {
												id: checkId,
												userPhone,
												protocol,
												url,
												method,
												successCodes,
												timeoutSeconds,
											}
											// Save the check DTO
											_data.create('checks', checkId, check, err => {
												if (!err) {
													// Add new checkId to user's object
													userData.checks = userChecks
													userData.checks.push(checkId)
													// Save the new user data
													_data.update('users', userPhone, userData, err => {
														if (!err) {
															// Return the data about the new check
															cb(200, check)
														} else {
															cb(500, { error: 'Could not update the user with the new check' })
														}
													})
												} else {
													cb(500, { error: 'Could not create the new check' })
												}
											})
										} else {
											cb(400, {
												error: 'The hostname of the URL entered did not resolve to any DNS entries',
											})
										}
									})
								} else {
									cb(400, {
										error: `The user already has the maximum number of checks (${config.maxChecks})`,
									})
								}
							} else {
								cb(403)
							}
						})
					} else {
						cb(403)
					}
				})
			} else {
				cb(400, { error: 'Missing or invalid field(s)' })
			}
		},
		// Checks - put
		// Required data: id
		// Optional data: protocol, url, method, successCodes, timeoutSeconds (at least one)
		put: (data, cb) => {
			// Check for required fields
			const { headers, payload } = data
			const id =
				typeof payload.id === 'string' && payload.id.trim().length === 20
					? payload.id.trim()
					: false
			// Check for optional fields
			const protocol =
				typeof payload.protocol === 'string' && ['http', 'https'].includes(payload.protocol)
					? payload.protocol
					: false
			const url =
				typeof payload.url === 'string' && payload.url.trim().length > 0
					? payload.url.trim()
					: false
			const method =
				typeof payload.method === 'string' &&
				['get', 'post', 'put', 'delete'].includes(payload.method)
					? payload.method
					: false
			const successCodes =
				typeof payload.successCodes === 'object' &&
				payload.successCodes instanceof Array &&
				payload.successCodes.length > 0
					? payload.successCodes
					: false
			const timeoutSeconds =
				typeof payload.timeoutSeconds === 'number' &&
				payload.timeoutSeconds % 1 === 0 &&
				payload.timeoutSeconds >= 1 &&
				payload.timeoutSeconds <= 5
					? payload.timeoutSeconds
					: false

			// Check to make sure ID is valid
			if (id) {
				// Check to make sure at least one or more optional fields have been sent
				if (protocol || url || method || successCodes || timeoutSeconds) {
					// Look up the check
					_data.read('checks', id, (err, checkData) => {
						if (!err && checkData) {
							// Get the token from the headers
							const token = typeof headers.token === 'string' ? headers.token : false
							// Verify that the given token is valid for the phone number
							apiHandlers.tokens.verifyToken(token, checkData.userPhone, isValid => {
								if (isValid) {
									// Update the check where necessary
									if (protocol) checkData.protocol = protocol
									if (url) checkData.url = url
									if (method) checkData.method = method
									if (successCodes) checkData.successCodes = successCodes
									if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds

									// Store the new updates
									_data.update('checks', id, checkData, err => {
										if (!err) {
											cb(200)
										} else {
											cb(500, { error: 'Could not update the check' })
										}
									})
								} else {
									cb(403)
								}
							})
						} else {
							cb(400, { error: `Could not find check with id of ${id}` })
						}
					})
				} else {
					cb(400, {
						error:
							'Missing at least one field to update - protocol, url, method, successCodes, timeoutSeconds',
					})
				}
			} else {
				cb(400, { error: 'Missing or invalid field - id' })
			}
		},
		// Checks - delete
		// Required data: id
		// Optional data: none
		delete: (data, cb) => {
			// Check that id provided is valid
			const { headers, qs } = data
			const id = typeof qs.id === 'string' && qs.id.trim().length === 20 ? qs.id.trim() : false
			if (!id) {
				cb(400, { error: `Missing or invalid required field - id` })
			} else {
				// Look up check
				_data.read('checks', id, (err, checkData) => {
					if (!err && checkData) {
						// Get the token from the headers
						const token = typeof headers.token === 'string' ? headers.token : false
						// Verify that the given token is valid for the phone number
						apiHandlers.tokens.verifyToken(token, checkData.userPhone, isValid => {
							if (isValid) {
								// Delete the check
								_data.delete('checks', id, err => {
									if (!err) {
										// Delete the check from user checks object
										_data.read('users', checkData.userPhone, (err, userData) => {
											if (!err && userData) {
												let userChecks =
													typeof userData.checks === 'object' && userData.checks instanceof Array
														? userData.checks
														: []
												// Remove the deleted check from their list of checks
												const userCheckToDeleteIdx = userChecks.indexOf(id)
												if (userCheckToDeleteIdx > -1) {
													userChecks.splice(userCheckToDeleteIdx, 1)
													// Re-save the user's data
													_data.update('users', checkData.userPhone, userData, err => {
														if (!err) {
															cb(200)
														} else {
															cb(500, { error: 'Could not update the specified user' })
														}
													})
												} else {
													cb(500, {
														error: 'Could not find the check to delete within the user checks list',
													})
												}
											} else {
												cb(500, {
													error:
														'Could not user who created the check - could not remove check from user',
												})
											}
										})
									} else {
										cb(500, { error: 'Could not delete the check' })
									}
								})
							} else {
								cb(403)
							}
						})
					} else {
						cb(404, { error: `Could not find check with id of ${id}` })
					}
				})
			}
		},
	},
}

const apiHandlers = {
	// Ping handler, useful for monitoring that the API is up
	ping: (data, cb) => {
		cb(200)
	},
	// Example error response, throws an error to test logging and error handling
	error: (data, cb) => {
		const error = new Error(
			'I AM ERROR. I am a villager from in Ruto Town, and I was born on January 14th, 1987 in Japan.',
		)
		throw error
	},
	users: (data, cb) => {
		// Check to see if given method is accepted, and pass along to subhandlers
		const acceptedMethods = ['get', 'post', 'put', 'delete']
		if (acceptedMethods.includes(data.method)) {
			subHandlers._users[data.method](data, cb)
		} else {
			cb(405) // Not accepted method
		}
	},
	tokens: (data, cb) => {
		// Check to see if given method is accepted, and pass along to subhandlers
		const acceptedMethods = ['get', 'post', 'put', 'delete']
		if (acceptedMethods.includes(data.method)) {
			subHandlers._tokens[data.method](data, cb)
		} else {
			cb(405) // Not accepted method
		}
	},
	checks: (data, cb) => {
		// Check to see if given method is accepted, and pass along to subhandlers
		const acceptedMethods = ['get', 'post', 'put', 'delete']
		if (acceptedMethods.includes(data.method)) {
			subHandlers._checks[data.method](data, cb)
		} else {
			cb(405) // Not accepted method
		}
	},
}

// General purpose function to check if token matches given user
// Verify if a given token ID is currently valid for a given user
apiHandlers.tokens.verifyToken = (id, phone, cb) => {
	// Look up the token
	_data.read('tokens', id, (err, tokenData) => {
		if (!err && tokenData) {
			// Check that the token is for the given user and has not expired
			if (tokenData.phone === phone && tokenData.expires > Date.now()) {
				cb(true)
			} else {
				cb(false)
			}
		} else {
			cb(false)
		}
	})
}

module.exports = apiHandlers
