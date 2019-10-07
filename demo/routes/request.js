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
    handler: async (request, h) => {
      const { journey } = request.params
      const { idm } = request.server.methods
      const claims = await idm.getClaims(request)
      if (!claims) {
        return h.redirect('/error')
      }
      const { contactId } = claims
      // Get all unspent EnrolmentRequests
      const currentEnrolmentRequests = await idm.dynamics.readEnrolmentRequests(null, contactId, false)
      // convert the enrolments into the data structure required by the data rows in the view

      const currentEnrolments = await idm.dynamics.readEnrolment(contactId, null, null, null, null, true)
      const rawEnrolments = currentEnrolments.value || []
      // convert the enrolments into the data structure required by the data rows in the view
      const enrolments = rawEnrolments.map((thisEnrolment) => {
        return {
          accountName: thisEnrolment['_defra_organisation_value@OData.Community.Display.V1.FormattedValue'],
          accountId: thisEnrolment['_defra_organisation_value'],
          enrolmentType: thisEnrolment['_defra_servicerole_value@OData.Community.Display.V1.FormattedValue'],
          serviceName: thisEnrolment['_defra_service_value@OData.Community.Display.V1.FormattedValue'],
          serviceId: thisEnrolment['_defra_organisation_value'],
          status: thisEnrolment['defra_enrolmentstatus@OData.Community.Display.V1.FormattedValue'],
          statusId: thisEnrolment['defra_enrolmentstatus'],
          roleName: thisEnrolment['_defra_serviceuser_value@OData.Community.Display.V1.FormattedValue'],
          roleId: thisEnrolment['_defra_serviceuser_value'],
          connectionDetailsId: thisEnrolment['_defra_connectiondetail_value']
        }
      })
      // Return a list of services as {unid, accountName, enrolmentType, status}

      const enrolmentRequests = await idm.dynamics.readEnrolmentRequests(null, contactId, false)
      const connectionIds = enrolmentRequests.map(r => r.connectionDetailsId)
      const services = enrolments.filter(e => connectionIds.indexOf(e.connectionDetailsId) > -1)
      services.sort((a, b) => {
        return a.status + (a.accountName + '').toUpperCase() >= b.status + (b.accountName + '').toUpperCase() ? 1 : -1
      })
      return h.view('request', {
        title: 'Requests',
        idm,
        journeyName: serviceLookup[journey].serviceName,
        journey,
        services,
        enrolments: currentEnrolmentRequests.length,
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
