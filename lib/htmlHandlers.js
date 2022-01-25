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

	// Loop through our global AND template-specific data, inserting its value into the string at the corresponding position
	for (let key in data) {
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

/**
 * Get the contents of a static (public) asset
 * @param {string} assetName - The name of the asset to look for within public dir
 * @param {function} cb - A callback to pass back an error and/or data
 */
const getStaticAsset = (assetName, cb) => {
	const filename = typeof assetName === 'string' && assetName.length > 0 ? assetName : false
	if (filename) {
		const publicDir = path.join(__dirname, '/../public/')
		fs.readFile(`${publicDir}${filename}`, (err, data) => {
			if (!err && data) {
				cb(err, data)
			} else {
				cb('No file could be found')
			}
		})
	} else {
		cb('A valid file name was not specified')
	}
}

const htmlHandlers = {
	// Static assets
	favicon: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Read in the favicon's data
			getStaticAsset('favicon.ico', (err, data) => {
				if (!err && data) {
					cb(200, data, 'favicon')
				} else {
					cb(500)
				}
			})
		} else {
			cb(405)
		}
	},
	public: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Read in all files' data within the public directory
			// Get filename being requested
			const assetName = data.path.replace('public/', '').trim()
			if (assetName.length > 0) {
				getStaticAsset(assetName, (err, data) => {
					if (!err && data) {
						// Determine the content type, default to plain text
						let contentType = 'plain'
						if (assetName.includes('.css')) contentType = 'css'
						if (assetName.includes('.png')) contentType = 'png'
						if (assetName.includes('.jpg')) contentType = 'jpg'
						if (assetName.includes('.ico')) contentType = 'favicon'
						// Call back the asset data with proper content type
						cb(200, data, contentType)
					} else {
						cb(500)
					}
				})
			} else {
				cb(405)
			}
		}
	},
	index: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Uptime Monitoring - Welcome',
				'head.description':
					'We offer free, simple uptime monitoring for HTTP/HTTPS sites of all kinds. When your site goes down, we will set you a text to let you know.',
				'body.class': 'index',
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
	accountCreate: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Create an Account',
				'head.description': 'Signing up is easy and only takes a few seconds.',
				'body.class': 'accountCreate',
			}

			// Read in a template as a string
			getTemplate('accountCreate', templateData, (err, str) => {
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
	accountEdit: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Account Settings',
				'body.class': 'accountEdit',
			}

			// Read in a template as a string
			getTemplate('accountEdit', templateData, (err, str) => {
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
	accountDeleted: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Account Deleted',
				'head.description': 'Your account has been deleted',
				'body.class': 'accountDeleted',
			}

			// Read in a template as a string
			getTemplate('accountDeleted', templateData, (err, str) => {
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
	sessionCreate: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Log into your Account',
				'head.description': 'Please enter your phone number and password to access your account',
				'body.class': 'sessionCreate',
			}

			// Read in a template as a string
			getTemplate('sessionCreate', templateData, (err, str) => {
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
	sessionDeleted: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Logged Out',
				'head.description': 'You have been logged out of your account',
				'body.class': 'sessionDeleted',
			}

			// Read in a template as a string
			getTemplate('sessionDeleted', templateData, (err, str) => {
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
	checksList: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Dashboard',
				'body.class': 'checksList',
			}

			// Read in a template as a string
			getTemplate('checksList', templateData, (err, str) => {
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
	checksCreate: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Create a New Check',
				'body.class': 'checksCreate',
			}

			// Read in a template as a string
			getTemplate('checksCreate', templateData, (err, str) => {
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
	checksEdit: (data, cb) => {
		// Reject any request that is not a 'GET'
		if (data.method === 'get') {
			// Prepare data for interpolation
			const templateData = {
				'head.title': 'Check Details',
				'body.class': 'checksEdit',
			}

			// Read in a template as a string
			getTemplate('checksEdit', templateData, (err, str) => {
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
}

module.exports = htmlHandlers
