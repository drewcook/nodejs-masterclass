/**
 * Request handlers
 */
const _data = require('./data')
const helpers = require('./helpers')

// The subhandlers for each resource (GET,POST,PUT,DELETE)
const subHandlers = {
	_users: {
		// Users - get
		// Required data: phone
		// Optional data: none
		// TODO: Only let an authenticated user access their object, don't let them access anyone else's
		get: (data, cb) => {
			// Check that the phone number is valid
			const { qs } = data
			const phone =
				typeof qs.phone === 'string' && qs.phone.trim().length === 10 ? qs.phone.trim() : false
			if (!phone) {
				cb(400, { error: `Missing or invalid required field - phone` })
			} else {
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
				cb(400, { error: 'Missing required field(s)' })
			}
		},
		// Users - put
		// Required data: phone
		// Optional data: firstName, lastName, password (at least one must be specified)
		// TODO: Only let an authenticated user update their own object, don't let them update anyone else's
		put: (data, cb) => {
			const { payload } = data
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
		// TODO: Only let an authenticated user delete their own object, don't let them delete anyone else's
		// TODO: Cleanup (delete) any other data files associated with this user
		delete: (data, cb) => {
			// Check that the phone number is valid
			const { qs } = data
			const phone =
				typeof qs.phone === 'string' && qs.phone.trim().length === 10 ? qs.phone.trim() : false
			if (!phone) {
				cb(400, { error: `Missing or invalid required field - phone` })
			} else {
				// Look up user
				_data.read('users', phone, (err, userData) => {
					if (!err && userData) {
						_data.delete('users', phone, err => {
							if (!err) {
								cb(200)
							} else {
								cb(500, { error: 'Could not delete the user' })
							}
						})
					} else {
						cb(400, { error: `Could not find user with phone number of ${phone}` })
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
			const { payload } = data
			const phone =
				typeof payload.phone === 'string' && payload.phone.trim().length === 10
					? payload.phone.trim()
					: false
			const password =
				typeof payload.password === 'string' && payload.password.trim().length > 0
					? payload.password.trim()
					: false

			if (phone && password) {
				// Look up user with given phone
				_data.read('users', phone, (err, userData) => {
					if (!err && userData) {
						// Hash the sent password and compare against the password stored for the user
						const hashedPassword = helpers.hash(password)
						if (hashedPassword === userData.hashedPassword) {
							// If valid, create a new token with a random name, set expiry for 1 hour in future
							const tokenId = helpers.createRandomString(20)
							const expires = Date.now() + 1000 * 60 * 60
							const token = {
								id: tokenId,
								phone,
								expires,
							}
							// Store the token
							_data.create('tokens', tokenId, token, err => {
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
}

// Callback an HTTP status code and a payload object
const handlers = {
	// Ping handler, useful for monitoring that the API is up
	ping: (data, cb) => {
		cb(200)
	},
	// Default not found handler
	notFound: (data, cb) => {
		cb(404)
	},
	// Users
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
}

module.exports = handlers
