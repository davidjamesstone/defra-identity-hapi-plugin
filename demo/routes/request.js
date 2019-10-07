const serviceLookup = require('../lib/services')
/**
 * GUID
 * @typedef {string} GUID A globally unique identifier
 */

module.exports = [
  {
    method: 'GET',
    path: '/request/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async function (request, h) {
      const { journey } = request.params
      const { idm } = request.server.methods
      const { serviceId, serviceName } = serviceLookup[journey]
      const config = idm.getConfig()
      config.serviceId = serviceId
      await idm.refreshToken(request) // ensure we read the latest changes so the view reflects the database
      const claims = await idm.getClaims(request)
      const { contactId } = claims || request.params
      const enrolmentRequests = await idm.dynamics.readEnrolmentRequests(null, contactId, false)
      return h.view('request', {
        ...request.payload,
        ...request.params,
        errorMessage: '',
        enrolmentRequests,
        serviceName,
        serviceLookup,
        title: 'Requests'
      })
    }
  },
  {
    method: 'POST',
    path: '/request/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async function (request, h) {
      return h.view('request', {
        ...request.payload,
        ...request.params,
        errorMessage: '',
        title: 'Requests'
      })
    }
  }
]
