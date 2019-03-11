const { URL } = require('url')
const authCookie = require('hapi-auth-cookie')
const Hoek = require('hoek')
const debug = require('debug')('defra.identity:index')
const qs = require('querystring')
const Joi = require('joi')

const routes = require('./routes')
const methods = require('./methods')
const Internals = require('./internals')
const configDefaults = require('./config/defaults')
const configSchema = require('./config/schema')

const setConfig = options => {
  debug('Setting config')

  const config = Hoek.applyToDefaults(configDefaults, options)

  const validated = Joi.validate(config, configSchema)

  Hoek.assert(!validated.error, validated.error)

  const { appDomain } = options

  const redirectUri = new URL(appDomain)

  redirectUri.pathname = config.redirectUri

  config.redirectUriFqdn = redirectUri.toString()

  debug('Config set')

  return config
}

module.exports = {
  name: 'idm',
  version: '0.0.1',
  register: async function (server, options) {
    debug('Auth plugin register called')

    const config = setConfig(options)

    const {
      cacheSegment,
      cacheCookieTtlMs,
      cookiePassword,
      cookieName,
      disallowedRedirectPath,
      loginOnDisallow,
      isSecure,
      onByDefault,
      defaultPolicy,
      passRequestToCacheMethods
    } = config

    // Initialise cache
    let specifiedCache

    if (options.cache) {
      debug('Cache object passed in, using that for our cache')

      specifiedCache = options.cache
    } else {
      debug('No cache object specified, using in memory cache with segment %s', cacheSegment)

      specifiedCache = server.cache({
        segment: cacheSegment,
        expiresIn: cacheCookieTtlMs
      })
    }

    const cache = {
      async get (key, request) {
        if (passRequestToCacheMethods) {
          return specifiedCache.get(key, request)
        } else {
          return specifiedCache.get(key)
        }
      },
      async set (key, value, ttl, request) {
        if (passRequestToCacheMethods) {
          return specifiedCache.set(key, value, ttl, request)
        } else {
          return specifiedCache.set(key, value, ttl)
        }
      },
      async drop (key, request) {
        if (passRequestToCacheMethods) {
          return specifiedCache.drop(key, request)
        } else {
          return specifiedCache.drop(key)
        }
      }
    }

    // Register internal methods
    const internals = Internals({
      server,
      cache,
      config
    })

    if (defaultPolicy) {
      await internals.client.getClient({ policyName: defaultPolicy })
    }

    // Register server methods
    methods({
      server,
      cache,
      config,
      internals
    })

    debug('Registering hapi-auth-cookie...')

    // Register cookie plugin
    await server.register(authCookie)

    server.auth.strategy('idm', 'cookie', {
      password: cookiePassword,
      cookie: cookieName,
      redirectOnTry: false,
      appendNext: true,
      ttl: cacheCookieTtlMs,
      isSecure,
      isSameSite: 'Lax',
      redirectTo: (request) => {
        const { path } = request

        let redirectTo

        if (loginOnDisallow) {
          redirectTo = server.methods.idm.generateAuthenticationUrl(path)
        } else {
          redirectTo = disallowedRedirectPath

          redirectTo += '?' + qs.stringify({
            notLoggedInErr: 'yes'
          })
        }

        return redirectTo
      },
      validateFunc: async (request, session) => {
        // Retrieve from session store
        const credentials = await server.methods.idm.getCredentials(request)

        return {
          valid: credentials && !credentials.isExpired(),
          credentials
        }
      }
    })

    debug('Done registering hapi-auth-cookie')

    if (onByDefault) {
      debug('onByDefault is true - setting default auth method')

      server.auth.default('idm')
    } else {
      debug('onByDefault is false - not setting default auth method')
    }

    // Register routes
    routes({
      server,
      cache,
      config,
      internals
    })

    debug('Auth plugin successfully registered')
  }
}
