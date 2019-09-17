// const config = require('../config')

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

      // A structure that matches the default service role for a given service name, eg chemicals is 'REACH Manager'
      const serviceRoleIdLookup = {
        'chemicals': 'e45f4250-c2cc-e811-a95b-000d3a29ba60', // REACH Manager
        'mmo': '23016fc5-7acc-e811-a95b-000d3a29ba60', // Admin User
        'vmdapply': '0dee7d46-71b6-e811-a954-000d3a29b5de', // Standard User
        'ipaffs': '57502079-ce02-e911-a847-000d3ab4ffef', // Administrator
        'exports': 'cc108aff-b6df-e811-a845-000d3ab4ffef', // Official Veterinarian
        'vmdsecure': '3015249a-c1cc-e811-a95b-000d3a29ba6', // Standard User
        'vmdreport': '3c669b52-71b6-e811-a954-000d3a29b5de', // Standard User
        'certifier': '14c9c4b4-8675-e911-a850-000d3ab4ffef' // Certifier
      }

      // TODO: Get the serviceId from the session where we stashed it earlier
      // const { serviceRoleId, identity: { serviceId } } = config
      const cache = idm.getCache()
      const serviceId = await cache.get('sessionId')
      const serviceRoleId = serviceRoleIdLookup(serviceId)

      try {
        const claims = await idm.getClaims(request)
        const parsedAuthzRoles = idm.dynamics.parseAuthzRoles(claims)
        const { contactId } = claims

        // Get the accounts this contact is linked with
        const contactAccountLinks = await idm.dynamics.readContactsAccountLinks(contactId)

        if (!contactAccountLinks || !contactAccountLinks.length) {
          throw new Error(`Contact record not linked to any accounts - contactId ${contactId}`)
        }

        // Get details of our existing enrolments for this service
        const currentEnrolments = await idm.dynamics.readEnrolment(contactId, null, null, null, serviceId, true)

        // Our array of tasks
        let promises = []

        // Create promises to create enrolments for links that we currently don't have enrolments for
        promises = promises.concat(contactAccountLinks.map(link => {
          const existingEnrolment = parsedAuthzRoles.rolesByOrg[link.accountId]

          if (!existingEnrolment) {
            return idm.dynamics.createEnrolment(contactId, link.connectionDetailsId, newEnrolmentStatusId, link.accountId, undefined, serviceRoleId)
          }
        }).filter(i => !!i))

        // Create promises to update the status of enrolments we do already have
        promises = promises.concat(currentEnrolments.value
          .map(currentEnrolment => idm.dynamics.updateEnrolmentStatus(currentEnrolment.defra_lobserviceuserlinkid, newEnrolmentStatusId)))

        // Wait for all promises to complete
        await Promise.all(promises)

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
