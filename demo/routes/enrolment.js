// const config = require('../config')
const serviceLookup = require('../lib/services')

/**
 * filter the available services to only those for which there is an enrolment request
 * @param {Object} list
 * @param {Array<EnrolmentRequest} requests
 */
const filterServiceLookup = (list, requests) => {
  const allowedServices = requests.map(r => r.serviceId)
  const result = {}
  Object.keys(list).forEach((key) => {
    if (allowedServices.includes(list[key].serviceId)) {
      result[key] = list[key]
    }
  })
  return result
}

module.exports = [
  {
    method: 'GET',
    path: '/enrolment/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async function (request, h) {
      const { journey } = request.params
      const errorMessage = !serviceLookup.hasOwnProperty(journey) ? 'Invalid Journey Type!' : undefined
      if (errorMessage) {
        return h.view('enrolment', {
          title: 'enrolment',
          contactId: '',
          journey,
          errorMessage,
          serviceName: '',
          serviceLookup,
          accountNames: [],
          parsedAuthzRoles: { flat: () => ([]) }
        })
      }
      const { idm } = request.server.methods
      const serviceId = serviceLookup[journey].serviceId
      let config = idm.getConfig()
      config.serviceId = serviceId
      await idm.refreshToken(request) // ensure we read the latest changes so the view reflects the database
      const claims = await idm.getClaims(request)
      const parsedAuthzRoles = idm.dynamics.parseAuthzRoles(claims)
      const { contactId } = claims || request.params

      // Get all unspent EnrolmentRequests
      const enrolmentRequests = await idm.dynamics.readEnrolmentRequests(serviceId, contactId)

      // read the accounts associated with the connections
      const accountIds = enrolmentRequests.map(conn => conn.accountId)
      let accountNames = []
      const noConnectionDetails = { connectionDetailsId: null }
      if (accountIds && accountIds.length) {
        const accounts = await idm.dynamics.readAccounts(accountIds)
        accountNames = accounts.map((thisAccount) => {
          return {
            accountId: thisAccount.accountId,
            accountName: thisAccount.accountName,
            request: enrolmentRequests.find(r => r.accountId === thisAccount.accountId) || noConnectionDetails // pass the request to allow the connectionDetailsId to be used as the drop-down value
          }
        })
      }
      accountNames.push({ accountId: 'citizen', accountName: 'Citizen', request: enrolmentRequests.find(r => r.accountId === null) || noConnectionDetails })
      // filter the serviceLookup list to only show services you're allowed (ie there's an enrolmentRequest for it)
      const services = filterServiceLookup(serviceLookup, enrolmentRequests)
      return h.view('enrolment', {
        title: 'enrolment',
        idm,
        claims,
        journey,
        errorMessage,
        enrolmentRequests: enrolmentRequests.length,
        serviceName: serviceLookup[journey].serviceName,
        contactId,
        accountNames,
        serviceLookup: services,
        parsedAuthzRoles,
        credentials: await idm.getCredentials(request)
      })
    }
  },
  {
    method: 'POST',
    path: '/enrolment/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async function (request, h) {
      const { idm } = request.server.methods
      const { enrolmentStatusId, journey, connectionDetailsId } = request.payload
      const newEnrolmentStatusId = Number(enrolmentStatusId)
      const serviceRoleId = serviceLookup[journey].roleId
      const serviceId = serviceLookup[journey].serviceId

      try {
        const claims = await idm.getClaims(request)
        const { contactId } = claims

        // Get all unspent EnrolmentRequests
        const enrolmentRequests = await idm.dynamics.readEnrolmentRequests(serviceId, contactId)

        if (!enrolmentRequests || !enrolmentRequests.length) {
          throw new Error(`No unspent enrolment requests - contactId ${contactId}`)
        }

        // Create an enrolment for this user/organisation/service combination
        const matchedRequest = enrolmentRequests.find(r => r.connectionDetailsId === connectionDetailsId) || {}
        if (connectionDetailsId) {
          await idm.dynamics.createEnrolment(contactId, connectionDetailsId, newEnrolmentStatusId, matchedRequest.accountId, undefined, serviceRoleId)
        }
        // Refresh our token with new roles and set the plugin serviceId
        let config = idm.getConfig()
        config.serviceId = serviceId
        await idm.refreshToken(request)
        return h.redirect(`/enrolment/${journey}`)
      } catch (e) {
        console.error(e)
        return `Uh oh. Error: ${e}`
      }
    }
  }
]
