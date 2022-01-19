/**
 * Request handlers
 */
const _data = require('./data')
const helpers = require('./helpers')

// TESTING OUR DATASTORE - CRUD
// _data.create('test', 'example', { name: 'Drew', isHealthy: false }, err => {
// 	if (err) console.error('An error occurred while creating a new file:\n', err)
// })
// _data.read('test', 'example', (err, data) => {
// 	if (err && !data) console.error('An error occurred while reading from a file:\n', err)
// 	if (data) console.log('Content from file:\n', data)
// })
// _data.update('test', 'example', { age: 32 }, err => {
// 	if (err) console.error('An error occurred while updating an existing file:\n', err)
// })
// _data.delete('test', 'example', err => {
// 	if (err) console.error('An error occurred while deleting a file:\n', err)
// })

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
		// Figure out what the method is, if it is accepted, and pass along to subhandlers
		const acceptedMethods = ['get', 'post', 'put', 'delete']
		if (acceptedMethods.includes(data.method)) {
			handlers._users[data.method](data, cb)
		} else {
			cb(405) // Not accepted method
		}
	},
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
}

module.exports = handlers
