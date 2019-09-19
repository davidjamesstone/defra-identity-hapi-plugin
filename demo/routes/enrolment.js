const config = require('../config')

module.exports = [
  {
    method: 'GET',
    path: '/enrolment',
    options: {
      auth: 'idm'
    },
    handler: async function (request, h) {
      const { idm } = request.server.methods

      const claims = await idm.getClaims(request)
      const parsedAuthzRoles = idm.dynamics.parseAuthzRoles(claims)

      return h.view('enrolment', {
        title: 'enrolment',
        idm,
        claims,
        parsedAuthzRoles,
        credentials: await idm.getCredentials(request)
      })
    }
  },
  {
    method: 'POST',
    path: '/enrolment',
    options: {
      auth: 'idm'
    },
    handler: async function (request) {
      const { idm } = request.server.methods
      const { enrolmentStatusId } = request.payload
      const newEnrolmentStatusId = Number(enrolmentStatusId)
      const { serviceRoleId, identity: { serviceId } } = config

      try {
        const claims = await idm.getClaims(request)
        const { contactId } = claims

        // Get all unspent EnrolmentRequests
        const enrolmentRequests = await idm.dynamics.readEnrolmentRequests(serviceId, contactId)

        if (!enrolmentRequests.length) {
          return 'No unspent enrolment requests. <a href="/enrolment">Click here to return</a>'
        }

        // Create enrolments for all our unspent EnrolmentRequests
        await Promise.all(enrolmentRequests.map(enrolmentRequest => idm.dynamics.createEnrolment(contactId, enrolmentRequest.connectionDetailsId, newEnrolmentStatusId, enrolmentRequest.accountId, serviceId, serviceRoleId)))

        // Refresh our token with new roles
        await idm.refreshToken(request)

        return 'Enrolment successfully updated. <a href="/enrolment">Click here to return</a>'
      } catch (e) {
        console.error(e)

        return `Uh oh. Error: ${e}`
      }
    }
  }
]
