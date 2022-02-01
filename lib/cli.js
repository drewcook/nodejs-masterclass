/**
 * CLI-Related Tasks
 *
 */

const readline = require('readline')
const util = require('util')
const events = require('events')

// Create a debug log for CLI
const debug = util.debuglog('cli')

// Extend the events class to work with events
class _events extends events {}
const e = new _events()

const cli = {
	// Initial bootstrapping
	init: () => {
		// Send the start message to the console, in dark blue
		console.log('\x1b[34m%s\x1b [0m', 'The CLI is running')
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
			console.log('processing...', input)
			// Codify the unique strings that identify the unique questions allowed to be asked
			const uniqueCommands = [
				'man',
				'help',
				'exit',
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
					return true
				}
			})
			// If no match is found, tell user to try again
			if (!matchFound) console.log('Sorry, try again.')
		}
	},
}

module.exports = cli
