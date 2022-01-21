/**
 * A CRUD library used for storing and editing data within the filesystem datastore
 * We are using the filesystem as a key value datastore, for simplicity.
 * We are using the hidden .data/ directory as our datastore. Subdirectories will represent a collection or database table.
 */

const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

const lib = {}

// Base directory of the datastore
lib.baseDir = path.join(__dirname, '../.data/')

/**
 *
 * Creates a file in our datastore and writes data to it
 * @param {string} dir - The subdirectory or collection to write into
 * @param {string} filename - The name of the new file being created
 * @param {object} data - The data to write into the file
 * @param {function} cb - A callback to fire when there is an error
 */
lib.create = (dir, filename, data, cb) => {
	// Open the file for writing
	fs.open(`${lib.baseDir}${dir}/${filename}.json`, 'wx', (err, fileDescriptor) => {
		if (!err && fileDescriptor) {
			// Convert data to string
			const stringData = JSON.stringify(data)
			// Write to file and close it
			fs.writeFile(fileDescriptor, stringData, err => {
				if (!err) {
					fs.close(fileDescriptor, err => {
						if (!err) {
							cb(false)
						} else {
							cb('Error closing new file')
						}
					})
				} else {
					cb('Error writing to new file')
				}
			})
		} else {
			cb('Could not create new file, it may already exist')
		}
	})
}

/**
 * Reads data from a file in our datastore
 * @param {string} dir - The subdirectory or collection to read from
 * @param {string} filename - The name of the file to read from
 * @param {function} cb - A callback to fire to handle any error and/or data
 */
lib.read = (dir, filename, cb) => {
	fs.readFile(`${lib.baseDir}${dir}/${filename}.json`, 'utf-8', (err, data) => {
		if (!err && data) {
			const parsedData = helpers.parseJsonStringToObject(data)
			cb(false, parsedData)
		} else {
			cb(err, data)
		}
	})
}

/**
 *
 * Writes data to a file in our datastore
 * @param {string} dir - The subdirectory or collection to write into
 * @param {string} filename - The name of the new file being created
 * @param {object} data - The data to write into the file
 * @param {function} cb - A callback to fire when there is an error
 */
lib.update = (dir, filename, data, cb) => {
	// Open the file for writing
	fs.open(`${lib.baseDir}${dir}/${filename}.json`, 'r+', (err, fileDescriptor) => {
		if (!err && fileDescriptor) {
			// Convert data to string
			const stringData = JSON.stringify(data)
			// Truncate the contents prior to writing on top of it
			fs.ftruncate(fileDescriptor, err => {
				if (!err) {
					// Write new contents to the file and close it
					fs.writeFile(fileDescriptor, stringData, err => {
						if (!err) {
							fs.close(fileDescriptor, err => {
								if (!err) {
									cb(false)
								} else {
									cb('Error closing the file')
								}
							})
						} else {
							cb('Error writing new content to existing file')
						}
					})
				} else {
					cb('Error truncating the file')
				}
			})
		} else {
			cb('Could not open the file for updating, it may not exist yet')
		}
	})
}

/**
 * Deletes a file from our datastore
 * @param {string} dir - The subdirectory or collection to delete from
 * @param {string} filename - The name of the file to be deleted
 * @param {function} cb - A callback to fire when there is an error
 */
lib.delete = (dir, filename, cb) => {
	// Unlink the file
	fs.unlink(`${lib.baseDir}${dir}/${filename}.json`, err => {
		if (!err) cb(false)
		else cb('Error deleting the file')
	})
}

/**
 * Lists out all the file names within a given subdirectory
 * @param {string} dir - The subdirectory or collection to list within
 * @param {function} cb - A callback to fire with err,data
 */
lib.list = (dir, cb) => {
	fs.readdir(`${lib.baseDir}/`, (err, data) => {
		if (!err && data && data.length > 0) {
			const trimmedFilenames = []
			data.forEach(filename => {
				trimmedFilenames.push(filename.replace('.json', ''))
			})
			cb(false, trimmedFilenames)
		} else {
			cb(err, data)
		}
	})
}

module.exports = lib
