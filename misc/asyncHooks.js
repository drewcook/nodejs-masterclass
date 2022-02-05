/**
 * Async hooks example
 * Use fs to write to stout synchronously, as console.log() is async
 */

const async_hooks = require('async_hooks')
const fs = require('fs')

// Target execution context
const targetExecutionContext = false

// Write an arbitrary async function
const whatTimeIsIt = cb => {
	setInterval(() => {
		fs.writeSync(
			1,
			`When the setInterval runs, the execution context is ${async_hooks.executionAsyncId()}\n`,
		)
		cb(Date.now())
	}, 1000)
}

// Call that function
whatTimeIsIt(time => {
	fs.writeSync(1, `The time is ${time}\n`)
})

// Hooks
const hooks = {
	init: (asyncId, type, triggerAsyncId, resource) => {
		fs.writeSync(1, `Hook init ${asyncId}\n`)
	},
	before: asyncId => {
		fs.writeSync(1, `Hook before ${asyncId}\n`)
	},
	after: asyncId => {
		fs.writeSync(1, `Hook after ${asyncId}\n`)
	},
	destroy: asyncId => {
		fs.writeSync(1, `Hook destroy ${asyncId}\n`)
	},
	promiseResolve: asyncId => {
		fs.writeSync(1, `Hook promiseResolve ${asyncId}\n`)
	},
}

// Create a new instance of AsyncHooks
const asyncHook = async_hooks.createHook(hooks)
asyncHook.enable()
