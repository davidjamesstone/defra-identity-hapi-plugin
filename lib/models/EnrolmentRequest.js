const BaseModel = require('./BaseModel')

class EnrolmentRequest extends BaseModel {
  constructor () {
    super()
    this.enrolmentRequestId = undefined
    this.serviceId = undefined
    this.accountId = undefined
    this.contactId = undefined
    this.connectionDetailsId = undefined
    this.status = undefined
    this.state = undefined
  }
}

const status = {
  unspent: 1,
  spent: 2,
  revoked: 910400000
}

EnrolmentRequest.status = status

module.exports = EnrolmentRequest
