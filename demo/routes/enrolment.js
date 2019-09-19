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
      const { idm } = request.server.methods
      const claims = await idm.getClaims(request)
      const parsedAuthzRoles = idm.dynamics.parseAuthzRoles(claims)
      const { contactId } = claims
      // read the connections for the current contact
      const rawConnections = await idm.dynamics.readContactsAccountLinks(contactId)
      // read the accounts associated with the connections
      const accountIds = rawConnections.map(conn => conn.accountId)
      const accounts = await idm.dynamics.readAccounts(accountIds)
      const accountNames = accounts.map((thisAccount) => {
        return {
          accountId: thisAccount.accountId,
          accountName: thisAccount.accountName
        }
      })
      return h.view('enrolment', {
        title: 'enrolment',
        idm,
        claims,
        journey,
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
        const parsedAuthzRoles = idm.dynamics.parseAuthzRoles(claims)
        const { contactId } = claims

        // Get the accounts this contact is linked with
        const contactAccountLinks = await idm.dynamics.readContactsAccountLinks(contactId)

        if (!contactAccountLinks || !contactAccountLinks.length) {
          throw new Error(`Contact record not linked to any accounts - contactId ${contactId}`)
        }

        // Get details of our existing enrolments for this service
        const currentEnrolments = await idm.dynamics.readEnrolment(contactId, null, null, null, serviceId, true)

        const thisConnection = currentEnrolments.value.find(conn => conn.accountId === accountId)
        const existingEnrolment = parsedAuthzRoles.rolesByOrg[accountId]
        if (!existingEnrolment && thisConnection) {
          await idm.dynamics.createEnrolment(contactId, thisConnection.connectionDetailsId, newEnrolmentStatusId, thisConnection.accountId, undefined, serviceRoleId)
          await idm.dynamics.updateEnrolmentStatus(thisConnection.defra_lobserviceuserlinkid, newEnrolmentStatusId)
          // Refresh our token with new roles
          await idm.refreshToken(request)
        }

        // Our array of tasks
        // let promises = []

        // Create promises to create enrolments for links that we currently don't have enrolments for
        // promises = promises.concat(contactAccountLinks.map(link => {
        //   const existingEnrolment = parsedAuthzRoles.rolesByOrg[link.accountId]
        //   if (!existingEnrolment) {
        //     return idm.dynamics.createEnrolment(contactId, link.connectionDetailsId, newEnrolmentStatusId, link.accountId, undefined, serviceRoleId)
        //   }
        // }).filter(i => !!i))

        // Create promises to update the status of enrolments we do already have
        // promises = promises.concat(
        //   currentEnrolments.value.map(currentEnrolment => idm.dynamics.updateEnrolmentStatus(currentEnrolment.defra_lobserviceuserlinkid, newEnrolmentStatusId))
        // )

        // Wait for all promises to complete
        // await Promise.all(promises)

        // return 'Enrolment successfully updated. <a href="/enrolment">Click here to return</a>'
        return h.redirect(`/enrolment/${journey}`)
      } catch (e) {
        console.error(e)

        return `Uh oh. Error: ${e}`
      }
    }
  }
]
