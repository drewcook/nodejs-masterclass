/**
 * This is for testing and dev purposes and is designed to throw by calling a variable that does not exist
 */

module.exports = () => {
	// bar does not exist, throw
	const foo = bar
}
