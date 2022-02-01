/**
 * CLI-Related Tasks
 *
 */

const readline = require('readline')
const util = require('util')
const events = require('events')
const os = require('os')
const v8 = require('v8')
const _data = require('./data')

// Create a debug log for CLI
const debug = util.debuglog('cli')

// Extend the events class to work with events
class _events extends events {}
const e = new _events()

/**
 * Our CLI Object
 */
const cli = {
	// Initial bootstrapping
	init: () => {
		// Send the start message to the console, in dark blue
		console.log('\x1b[34m%s\x1b[0m', 'The CLI is running')
		// Start the interface
		const _interface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			prompt: '> ',
		})
		// Create an initial prompt
		_interface.prompt()
		// Handle each line of input separately
		_interface.on('line', str => {
			// Send to the input processor
			cli.processInput(str)
			// Re-Initialize the prompt
			_interface.prompt()
		})
		// If the user stops the CLI, kill the associated process
		_interface.on('close', () => {
			process.exit(0)
		})
	},
	// Input processor
	processInput: inputStr => {
		// Only process the input if the user actually wrote something, otherwise ignore
		const input =
			typeof inputStr === 'string' && inputStr.trim().length > 0 ? inputStr.trim() : false
		if (input) {
			// Codify the unique strings that identify the unique questions allowed to be asked
			const uniqueCommands = [
				'exit',
				'man',
				'help',
				'stats',
				'list users',
				'list checks',
				'list logs',
				'more user info',
				'more check info',
				'more log info',
			]
			// Go through possible inputs, emit an event when match is found
			let matchFound = false
			let counter = 0
			uniqueCommands.some(cmd => {
				if (input.toLowerCase().includes(cmd)) {
					if (!matchFound) matchFound = true
					// Emit an event matching the unique input, and include the full string given
					e.emit(cmd, input)
					// Break out
					return true
				}
			})
			// If no match is found, tell user to try again
			if (!matchFound) console.log('Sorry, command not found. Please try again.')
		}
	},
	// Create a vertical space
	verticalSpace: numLines => {
		// Validate number
		const lines = typeof numLines === 'number' && numLines > 0 ? numLines : 1
		for (let i = 0; i < lines; i++) {
			console.log('')
		}
	},
	// Create a horizontal line
	horizontalLine: () => {
		// Get the available screen size
		const width = process.stdout.columns
		// Build the line
		let line = ''
		for (let i = 0; i < width; i++) {
			line += '-'
		}
		console.log(line)
	},
	// Create centered text on the screen
	centered: str => {
		const text = typeof str === 'string' && str.trim().length > 0 ? str.trim() : ''
		// Get the available screen size
		const width = process.stdout.columns
		// Calculate the left padding there should be
		const leftPadding = Math.floor((width - str.length) / 2)
		// Build the line
		// Put in left padded spaces before the string itself
		let line = ''
		for (let i = 0; i < leftPadding; i++) {
			line += ' '
		}
		line += text
		console.log(line)
	},
}

/**
 * Event Responders
 */

cli.responders = {
	// Kill the app
	exit: () => {
		process.exit(0)
	},
	// Help
	help: () => {
		const commands = {
			exit: 'Kill the CLI (and the rest of the application)',
			man: 'Show this help page',
			help: 'Alias of the "man" command',
			stats: 'Get statistics on the underlying operating system and resource utilization',
			'list users': 'Show a list of all the registered, non-deleted users in the system',
			'more user info --{userId}': 'Show details of a specific user',
			'list checks --up --down':
				'Show a list of all the active checks in the system, including their state. The "--up" and the "--down" are both optional.',
			'more check info --{checkId}': 'Show details of a specified check',
			'list logs':
				'Show a list of all the log filers available to be read (compressed and uncompressed)',
			'more log info --{fileName}': 'Show details of a specified log file',
		}

		// Show a header for the help page that is as wide as the screen
		cli.horizontalLine()
		cli.centered('CLI MANUAL')
		cli.horizontalLine()
		cli.verticalSpace(2)

		// Show each command, followed by its explanation, in white and yellow respectively
		for (let key in commands) {
			if (commands.hasOwnProperty(key)) {
				const value = commands[key]
				let line = `\x1b[33m${key}\x1b[0m`
				// Add spacing after key
				const padding = 60 - line.length
				for (let i = 0; i < padding; i++) {
					line += ' '
				}
				line += value
				console.log(line)
				cli.verticalSpace()
			}
		}
		cli.verticalSpace()
		cli.horizontalLine()
	},
	// Get OS stats
	stats: () => {
		// Compile an object of stats
		const stats = {
			'Load Average': os.loadavg().join(' '),
			'CPU Count': os.cpus().length,
			'Free Memory': os.freemem(),
			'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
			'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
			'Allocated Heap Used (%)': Math.round(
				(v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100,
			),
			'Allocated Heap Allocated (%)': Math.round(
				(v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100,
			),
			Uptime: os.uptime() + ' Seconds',
		}
		// Create a header for the stats
		cli.horizontalLine()
		cli.centered('SYSTEM STATISTICS')
		cli.horizontalLine()
		cli.verticalSpace(2)

		// Log out each stat
		for (let key in stats) {
			if (stats.hasOwnProperty(key)) {
				const value = stats[key]
				let line = `\x1b[33m${key}\x1b[0m`
				// Add spacing after key
				const padding = 60 - line.length
				for (let i = 0; i < padding; i++) {
					line += ' '
				}
				line += value
				console.log(line)
				cli.verticalSpace()
			}
		}
		cli.verticalSpace()
		cli.horizontalLine()
	},
	// Write out every user line by line
	listUsers: () => {
		_data.list('users', (err, userIds) => {
			if (!err && userIds && userIds.length > 0) {
				cli.verticalSpace()
				userIds.forEach(userId => {
					_data.read('users', userId, (err, userData) => {
						if (!err && userData) {
							let line = `Name: ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Checks: `
							const numChecks =
								typeof userData.checks === 'object' &&
								userData.checks instanceof Array &&
								userData.checks.length > 0
									? userData.checks.length
									: 0
							line += numChecks
							console.log(line)
							cli.verticalSpace()
						}
					})
				})
			}
		})
	},
	// Admins can print out everything about a particular user
	moreUserInfo: input => {
		// --userId
		const inputArr = input.split('--')
		const userId =
			typeof inputArr[1] === 'string' && inputArr[1].trim().length > 0 ? inputArr[1] : false
		if (userId) {
			// Lookup the user
			_data.read('users', userId, (err, userData) => {
				if (!err && userData) {
					// Remove hashed password
					delete userData.hashedPassword
					// Print the JSON with text highlighting
					cli.verticalSpace()
					console.dir(userData, { colors: true })
					cli.verticalSpace()
				}
			})
		}
	},
	// Print out all checks line by line
	listChecks: input => {
		_data.list('checks', (err, checkIds) => {
			if (!err && checkIds && checkIds.length > 0) {
				cli.verticalSpace()
				checkIds.forEach(checkId => {
					_data.read('checks', checkId, (err, checkData) => {
						if (!err && checkData) {
							let includeCheck = false
							let lowerString = input.toLowerCase()
							// Get state of check, default to down
							const state = typeof checkData.state === 'string' ? checkData.state : 'down'
							// Get state of check, default to unknown
							const stateOrUnknown =
								typeof checkData.state === 'string' ? checkData.state : 'unknown'

							// If user has specified the state, or hasn't specified any state, include the current check accordingly
							if (
								lowerString.includes(`--${state}`) ||
								(!lowerString.includes('--down') && !lowerString.includes('--up'))
							) {
								// Build each check log
								let line = `ID: ${checkData.id} ${checkData.method.toUpperCase()} ${
									checkData.protocol
								}://${checkData.url} State: ${stateOrUnknown}`
								console.log(line)
								cli.verticalSpace()
							}
						}
					})
				})
			}
		})
	},
	// Admins can print out everything about a particular check
	moreCheckInfo: input => {
		// --checkId
		const inputArr = input.split('--')
		const checkId =
			typeof inputArr[1] === 'string' && inputArr[1].trim().length > 0 ? inputArr[1] : false
		if (checkId) {
			// Lookup the user
			_data.read('checks', checkId, (err, checkData) => {
				if (!err && checkData) {
					// Print the JSON with text highlighting
					cli.verticalSpace()
					console.dir(checkData, { colors: true })
					cli.verticalSpace()
				}
			})
		}
	},
	// Print out all logs line by line
	listLogs: () => {
		console.log('Listing all logs...')
	},
	// A,mins can print out everything about a particular log if it is not compressed
	// Otherwise, decompress it and write it out
	moreLogInfo: () => {
		console.log('Getting log info')
		// --logId
	},
}

/**
 * Event Listeners
 */

e.on('exit', cli.responders.exit)
e.on('man', cli.responders.help)
e.on('help', cli.responders.help)
e.on('stats', cli.responders.stats)
e.on('list users', cli.responders.listUsers)
e.on('more user info', cli.responders.moreUserInfo)
e.on('list checks', cli.responders.listChecks)
e.on('more check info', cli.responders.moreCheckInfo)
e.on('list logs', cli.responders.listLogs)
e.on('more log info', cli.responders.moreLogInfo)

module.exports = cli
