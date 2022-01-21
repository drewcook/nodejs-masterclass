/**
 * A library for storing and rotating logs
 * - Writes log data into filesystem
 * - Rotates the log files at set intervals to compress and free up space on the filesystem
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const logs = {
	baseDir: path.join(__dirname, '/../.logs/'),
	/**
	 * Takes in data as a string and appends the data to the end of the file. If the file does not exist, it will be created.
	 * @param {string} filename - The name of the file to create (or add to) and write to
	 * @param {string} data - The data to write into the file, should be stringified
	 * @param {function} cb - A callback function for passing back an error
	 */
	append: (filename, data, cb) => {
		// Open file for appending
		fs.open(`${logs.baseDir}${filename}.log`, 'a', (err, fileDescriptor) => {
			if (!err && fileDescriptor) {
				// Append to file and close it
				fs.appendFile(fileDescriptor, `${data}\n`, err => {
					if (!err) {
						fs.close(fileDescriptor, err => {
							if (!err) {
								cb(false)
							} else {
								cb('Error closing the file being appended to')
							}
						})
					} else {
						cb('Error appending to file')
					}
				})
			} else {
				cb('Could not open file for appending')
			}
		})
	},
	/**
	 * Lists out all the log files within the logs directory, includes all non-compressed by default and optionally compressed
	 * @param {boolean} includeCompressed - Flag to check and include compressed files in returned data
	 * @param {function} cb - A callback function to pass back an error and data
	 */
	list: (includeCompressed, cb) => {
		fs.readdir(logs.baseDir, (err, data) => {
			if (!err && data && data.length > 0) {
				const trimmedFilenames = []
				data.forEach(filename => {
					// Add all the .log files (uncompressed files)
					if (filename.includes('.log')) trimmedFilenames.push(filename.replace('.log', ''))
					// Add all the compressed file if applicable
					if (includeCompressed && filename.includes('.gz.b64'))
						trimmedFilenames.push(filename.replace('.gz.b64', ''))
				})
				cb(false, trimmedFilenames)
			} else {
				cb(err, data)
			}
		})
	},
	/**
	 * Compresses a given log file into a zipped file using gzip and base64 encoding, provided by the params
	 * Converts [name].log -> [name].gz.b64 under same directory
	 * @param {string} fileId - The existing log filename to compress, minus extention
	 * @param {string} compressedFileId - The new filename to create as a compressed file, minus extention
	 * @param {function} cb - A callback to pass back an error
	 */
	compress: (fileId, compressedFileId, cb) => {
		const sourceFile = `${fileId}.log`
		const destFile = `${compressedFileId}.gz.b64`
		// Read the source file
		fs.readFile(`${logs.baseDir}${sourceFile}`, 'utf-8', (err, inputString) => {
			if (!err && inputString) {
				// Compress the data using gzip
				zlib.gzip(inputString, (err, buffer) => {
					if (!err && buffer) {
						// Send compressed data to destination file
						fs.open(`${logs.baseDir}${destFile}`, 'wx', (err, fileDescriptor) => {
							if (!err && fileDescriptor) {
								// Write to destination file
								fs.writeFile(fileDescriptor, buffer.toString('base64'), err => {
									if (!err) {
										// Close destination file
										fs.close(fileDescriptor, err => {
											if (!err) {
												cb(false)
											} else {
												cb(err)
											}
										})
									} else {
										cb(err)
									}
								})
							} else {
								cb(err)
							}
						})
					} else {
						cb(err)
					}
				})
			} else {
				cb(err)
			}
		})
	},
	/**
	 * Decompresses the contents of a .gz.b64 file into a string variable
	 * @param {string} fileId - The existing compressed log filename to unzip, minus extension
	 * @param {function} cb - A callback to pass back an error and the string output
	 */
	decompress: (fileId, cb) => {
		const filename = `${fileId}.gz.b64`
		fs.readFile(`${logs.baseDir}${filename}`, 'utf-8', (err, data) => {
			if (!err && data) {
				// Decompress the data into a buffer
				const inputBuffer = Buffer.from(data, 'base64')
				zlib.unzip(inputBuffer, (err, outputBuffer) => {
					if (!err && outputBuffer) {
						const outputString = outputBuffer.toString()
						cb(false, outputString)
					} else {
						cb(err)
					}
				})
			} else {
				cb(err)
			}
		})
	},
	/**
	 * Truncates a given file
	 * @param {string} logId - The log filename to truncate, minus extension
	 * @param {function} cb - A callback function to pass back an error
	 */
	truncate: (logId, cb) => {
		fs.truncate(`${logs.baseDir}${logId}.log`, 0, err => {
			if (!err) {
				cb(false)
			} else {
				cb(err)
			}
		})
	},
}

module.exports = logs
