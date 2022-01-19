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
		get: (data, cb) => {},
		// Users - post
		// Required data: firstName, lastName, phone, password, tosAgreement
		// Optional data: none
		post: (data, cb) => {
			const { payload } = data
			/*
        Check that all required fields are filled out, set up some basic requirements
        - firstName: Must be non-empty string
        - lastName: Must be non-empty string
        - phone: Must be a 10 digit string
        - password - Must be a non-empty string
        - tosAgreement: Must be true, boolean
      */
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
		// Required data: firstName, lastName, phone, password, tosAgreement
		// Optional data: none
		put: (data, cb) => {},
		// Users - delete
		// Required data: firstName, lastName, phone, password, tosAgreement
		// Optional data: none
		delete: (data, cb) => {},
	},
}

module.exports = handlers
