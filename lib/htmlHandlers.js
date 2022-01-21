/**
 * HTML-specific route handlers for serving static files with our HTTP server
 */

const fs = require('fs')
const path = require('path')
const config = require('./config')

/**
 * Gets the string content of a template as HTML
 * @param {string} templateName - Name of the template to get
 * @param {object} templateData - Optional data to pass along to use during interpolation
 * @param {function} cb - A callback function to pass back an error and/or template string
 */
const getTemplate = (templateName, templateData, cb) => {
	const isValidTemplateName =
		typeof templateName === 'string' && templateName.length > 0 ? templateName : false
	if (isValidTemplateName) {
		const templatesDir = path.join(__dirname, '/../templates/')
		fs.readFile(`${templatesDir}${templateName}.html`, 'utf-8', (err, str) => {
			if (!err && str && str.length > 0) {
				// Interpolate data within the string
				const htmlString = interpolate(str, templateData)
				cb(false, htmlString)
			} else {
				cb('No template could be found')
			}
		})
	} else {
		cb('A valid template name was not specified')
	}
}

/**
 * Add the header and footer to a string, and pass provided data object to header and footer for interpolation
 * @param {string} templateString - The template string to add header and footer around
 * @param {object} templateData - The template data
 * @param {function} cb - A callback function for passing back error and/or full template string
 */
const addUniversalTemplates = (templateString, templateData, cb) => {
	let str = typeof templateString === 'string' && templateString.length > 0 ? templateString : ''
	const data = typeof templateData === 'object' && templateData !== null ? templateData : {}
	// Get the header
	getTemplate('_header', templateData, (err, headerString) => {
		if (!err && headerString) {
			// Get the footer
			getTemplate('_footer', templateData, (err, footerString) => {
				if (!err && footerString) {
					// Add them all together
					const fullHtmlTemplate = headerString + templateString + footerString
					cb(false, fullHtmlTemplate)
				} else {
					cb('Could not find the footer template')
				}
			})
		} else {
			cb('Could not find the header template')
		}
	})
}

/**
 * Take a given HTML string and a data object and find/replace all the keys within it
 * @param {string} templateString - A stringified HTML template
 * @param {object} templateData - A data object containing variables to find and replace with their values
 */
const interpolate = (templateString, templateData) => {
	let str = typeof templateString === 'string' && templateString.length > 0 ? templateString : ''
	const data = typeof templateData === 'object' && templateData !== null ? templateData : {}

	// Add in global template data with a top-level key of 'global'
	const { templateGlobals } = config
	for (let keyName in templateGlobals) {
		if (templateGlobals.hasOwnProperty(keyName)) {
			data[`global.${keyName}`] = config.templateGlobals[keyName]
		}
	}
	console.log(data)
	// Loop through our global AND template-specific data, inserting its value into the string at the corresponding position
	for (let key in data) {
		console.log(typeof data[key])
		// TODO: support objects, i.e. nested data
		if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
			const replace = data[key]
			const find = `{${key}}`
			str = str.replace(find, replace)
		}
	}

	// Return the new template string with updated data
	return str
}

const htmlHandlers = {
	index: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Welcome',
				'head.description':
					'A fullstack Node app with no external dependencies, to monitor URLs and send SMS messages for status updates.',
				'body.title': 'Hello templated world!',
				'body.class': 'index ',
			}

			// Read in a template as a string
			getTemplate('index', templateData, (err, str) => {
				if (!err && str) {
					// Add in header and footer
					addUniversalTemplates(str, templateData, (err, str) => {
						if (!err && str) {
							cb(200, str, 'html')
						} else {
							cb(500, undefined, 'html')
						}
					})
				} else {
					cb(500, undefined, 'html')
				}
			})
		} else {
			cb(405, undefined, 'html')
		}
	},
	accountCreate: () => {},
	accountEdit: () => {},
	accountDeleted: () => {},
	sessionCreate: () => {},
	sessionDeleted: () => {},
	checksList: () => {},
	checksCreate: () => {},
	checksEdit: () => {},
}

module.exports = htmlHandlers
