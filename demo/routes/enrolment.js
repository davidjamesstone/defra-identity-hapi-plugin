// const config = require('../config')
const serviceLookup = require('../lib/services')

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
      let accountNames = [{accountId: contactId, accountName: 'Citizen'}]
      if (accountIds && accountIds.length) {
        const accounts = await idm.dynamics.readAccounts(accountIds)
        accountNames = accounts.map((thisAccount) => {
          return {
            accountId: thisAccount.accountId,
            accountName: thisAccount.accountName
          }
        })
      }
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
        serviceLookup,
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
      const { enrolmentStatusId, journey, accountId } = request.payload
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

        // TODO: how do we handle a citizen ??
        const parsedAuthzRoles = idm.dynamics.parseAuthzRoles(claims)
        const thisLink = enrolmentRequests.find(conn => conn.accountId === accountId)
        const existingEnrolment = parsedAuthzRoles.rolesByOrg[accountId]

        // Create an enrolment for this user/organisation/service combination
        if (!existingEnrolment && thisLink) {
          await idm.dynamics.createEnrolment(contactId, thisLink.connectionDetailsId, newEnrolmentStatusId, accountId, undefined, serviceRoleId)
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
