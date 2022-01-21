/**
 * HTML-specific route handlers for serving static files with our HTTP server
 */

const fs = require('fs')
const path = require('path')

/**
 * Gets the string content of a template as HTML
 * @param {string} templateName - Name of the template to get
 * @param {function} cb - A callback function to pass back an error and/or template string
 */
const getTemplate = (templateName, cb) => {
	const isValidTemplateName =
		typeof templateName === 'string' && templateName.length > 0 ? templateName : false
	if (isValidTemplateName) {
		const templatesDir = path.join(__dirname, '/../templates/')
		fs.readFile(`${templatesDir}${templateName}.html`, 'utf-8', (err, str) => {
			if (!err && str && str.length > 0) {
				cb(false, str)
			} else {
				cb('No template could be found')
			}
		})
	} else {
		cb('A valid template name was not specified')
	}
}

const htmlHandlers = {
	index: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			getTemplate('index', (err, str) => {
				if (!err && str) {
					cb(200, str, 'html')
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
