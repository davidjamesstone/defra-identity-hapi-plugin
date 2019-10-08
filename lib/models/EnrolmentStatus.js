const BaseModel = require('./BaseModel')

class EnrolmentStatus extends BaseModel {
  /**
   * Return a subset of the enrolment record needed by the status management page
   * @param {Enrolment} enrolment
   */
  constructor (enrolment) {
    super()
    this.accountName = enrolment['_defra_organisation_value@OData.Community.Display.V1.FormattedValue'] || 'Citizen'
    this.accountId = enrolment['_defra_organisation_value']
    this.enrolmentType = enrolment['_defra_servicerole_value@OData.Community.Display.V1.FormattedValue']
    this.enrolmentTypeId = enrolment['_defra_service_value']
    this.serviceName = enrolment['_defra_service_value@OData.Community.Display.V1.FormattedValue']
    this.serviceId = enrolment['_defra_organisation_value']
    this.status = enrolment['defra_enrolmentstatus@OData.Community.Display.V1.FormattedValue']
    this.statusId = enrolment['defra_enrolmentstatus']
    this.roleName = enrolment['_defra_serviceuser_value@OData.Community.Display.V1.FormattedValue']
    this.roleId = enrolment['_defra_serviceuser_value']
    this.connectionDetailsId = enrolment['_defra_connectiondetail_value']
    this.lobserviceuserlinkid = enrolment['defra_lobserviceuserlinkid']
  }
}

module.exports = EnrolmentStatus
