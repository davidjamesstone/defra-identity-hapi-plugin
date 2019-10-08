const serviceLookup = require('../lib/services')

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
      const enrolments = rawEnrolments.map((thisEnrolment) => {
        return {
          accountName: thisEnrolment['_defra_organisation_value@OData.Community.Display.V1.FormattedValue'] || 'Citizen',
          accountId: thisEnrolment['_defra_organisation_value'],
          enrolmentType: thisEnrolment['_defra_servicerole_value@OData.Community.Display.V1.FormattedValue'],
          enrolmentTypeId: thisEnrolment['_defra_service_value'],
          serviceName: thisEnrolment['_defra_service_value@OData.Community.Display.V1.FormattedValue'],
          serviceId: thisEnrolment['_defra_organisation_value'],
          status: thisEnrolment['defra_enrolmentstatus@OData.Community.Display.V1.FormattedValue'],
          statusId: thisEnrolment['defra_enrolmentstatus'],
          roleName: thisEnrolment['_defra_serviceuser_value@OData.Community.Display.V1.FormattedValue'],
          roleId: thisEnrolment['_defra_serviceuser_value'],
          connectionDetailsId: thisEnrolment['_defra_connectiondetail_value'],
          unid: thisEnrolment['defra_lobserviceuserlinkid']
        }
      }).filter(e => e.enrolmentTypeId !== '5a90dd44-dd9b-e811-a94f-000d3a3a8543')

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
      const { enrolmentStatusId, unid } = request.payload
      const { idm } = request.server.methods
      await idm.dynamics.updateEnrolmentStatus(unid, enrolmentStatusId)
      return h.redirect(`/status/${journey}`)
    }
  }
]
