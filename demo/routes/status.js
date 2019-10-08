const serviceLookup = require('../lib/services')
const EnrolmentStatus = require('../../lib/models/EnrolmentStatus')

/**
 * GUID
 * @typedef {string} GUID A globally unique identifier
 */

module.exports = [
  {
    method: 'GET',
    path: '/status/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async (request, h) => {
      const { journey } = request.params
      const { idm } = request.server.methods
      const claims = await idm.getClaims(request)
      if (!claims) {
        return h.redirect('/error')
      }
      const { contactId } = claims

      const currentEnrolments = await idm.dynamics.readEnrolment(contactId, null, null, null, null, true)
      const rawEnrolments = currentEnrolments.value || []
      // convert the enrolments into the data structure required by the data rows in the view
      const enrolments = rawEnrolments
        .map(thisEnrolment => new EnrolmentStatus(thisEnrolment))
        .filter(e => e.enrolmentTypeId !== '5a90dd44-dd9b-e811-a94f-000d3a3a8543')

      enrolments.sort((a, b) => {
        return a.status + (a.accountName + '').toUpperCase() >= b.status + (b.accountName + '').toUpperCase() ? 1 : -1
      })
      return h.view('status', {
        title: 'Requests',
        idm,
        journeyName: serviceLookup[journey].serviceName,
        journey,
        enrolments,
        errorMessage: '',
        serviceLookup,
        claims: await idm.getClaims(request),
        credentials: await idm.getCredentials(request),
        trulyPrivate: false
      })
    }
  },
  {
    method: 'POST',
    path: '/status/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async function (request, h) {
      const { journey } = request.params
      const { enrolmentStatusId, lobserviceuserlinkid } = request.payload
      const { idm } = request.server.methods
      await idm.dynamics.updateEnrolmentStatus(lobserviceuserlinkid, enrolmentStatusId)
      return h.redirect(`/status/${journey}`)
    }
  }
]
