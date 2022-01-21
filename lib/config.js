/**
 * Create and export configuration variables
 */

const secrets = require('../secrets')

// Development (default) environment
const development = {
	name: 'development',
	httpPort: 3000,
	httpsPort: 3001,
	hashingSecret: 'thisIsASecret',
	maxChecks: 5,
	twilio: {
		accountSid: secrets.TWILIO_ACCOUNT_SID,
		authToken: secrets.TWILIO_AUTH_TOKEN,
		fromPhone: secrets.TWILIO_PHONE,
	},
	templateGlobals: {
		appName: 'Node.js Uptime Monitor',
		companyName: 'dco.dev',
		yearCreated: '2022',
		baseUrl: 'http://localhost:3000',
	},
}

// Production environment
const production = {
	name: 'production',
	httpPort: 80,
	httpsPort: 443,
	hashingSecret: 'thisIsASecret',
	maxChecks: 5,
	twilio: {
		accountSid: secrets.TWILIO_ACCOUNT_SID,
		authToken: secrets.TWILIO_AUTH_TOKEN,
		fromPhone: secrets.TWILIO_PHONE,
	},
	templateGlobals: {
		appName: 'Node.js Uptime Monitor',
		companyName: 'dco.dev',
		yearCreated: '2022',
		baseUrl: 'http://localhost:80',
	},
}

const environments = {
	development,
	production,
}

// Determine which environment we are in via passed in NODE_ENV var
const currEnv = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : ''
// Check if current environment is one of ours above and use it, if not, default to staging
const config =
	typeof environments[currEnv] === 'object' ? environments[currEnv] : environments.development

module.exports = config
