/**
 * Example REPL server
 * Takes in the word 'fizz' and logs out 'buzz'
 */

const repl = require('repl')

// Start the repl
repl.start({
	prompt: '>',
	eval: str => {
		// Evaluation function for incoming inputs
		console.log(`At the evaluation stage: ${str}`)
		// If user said 'fizz', say 'buzz' back to them
		if (str.includes('fizz')) console.log('buzz')
	},
})
