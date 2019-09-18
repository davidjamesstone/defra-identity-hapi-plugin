// const config = require('../config')
const serviceLookup = require('../lib/services')

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
        serviceLookup,
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
      const { enrolmentStatusId, journey } = request.payload
      const newEnrolmentStatusId = Number(enrolmentStatusId)

      // TODO: Get the serviceId from the session where we stashed it earlier
      // const { serviceRoleId, identity: { serviceId } } = config
      const serviceRoleId = serviceLookup[journey].roleId
      const serviceId = serviceLookup[journey].serviceId

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
