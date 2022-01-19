/**
 * Create and export configuration variables
 */

// Development (default) environment
const development = {
	name: 'development',
	httpPort: 3000,
	httpsPort: 3001,
	hashingSecret: 'thisIsASecret',
}

// Production environment
const production = {
	name: 'production',
	httpPort: 80,
	httpsPort: 443,
	hashingSecret: 'thisIsASecret',
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
