const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'demo', '.env') })

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()

const { describe, it } = lab
const { expect } = Code

const Server = require('../../../server')

describe('Dynamics - create', async () => {
  let server
  let idm
  let dynamicsRoot

  // Get instance of server before each test
  lab.before(async () => {
    server = await Server()

    idm = server.methods.idm

    const idmConfig = idm.getConfig()

    dynamicsRoot = idmConfig.dynamics.resourceUrl + idmConfig.dynamics.endpointBase
  })

  describe('Create enrolment', async () => {
    it('should build correct request using required parameters', async () => {
      const { createEnrolment, getToken, getMappings } = idm.dynamics

      const { enrolmentStatus } = getMappings()
      const token = await getToken()

      const request = await createEnrolment.buildRequest('a20e6efe-9954-4c5b-a76c-83a5518a1385', 'b20e6efe-9954-4c5b-a76c-83a5518a1385', enrolmentStatus.pending, null, 'd20e6efe-9954-4c5b-a76c-83a5518a1381', 'd20e6efe-9954-4c5b-a76c-83a5518a1382', true)

      const expectedRequestObj = {
        method: 'POST',
        url: `${dynamicsRoot}/defra_lobserviceuserlinks`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json; charset=utf-8',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          Prefer: 'return=representation'
        },
        body: {
          'defra_connectiondetail@odata.bind': '/defra_connectiondetailses(b20e6efe-9954-4c5b-a76c-83a5518a1385)',
          'defra_ServiceUser@odata.bind': '/contacts(a20e6efe-9954-4c5b-a76c-83a5518a1385)',
          defra_enrolmentstatus: 2,
          defra_verified: true,
          'defra_ServiceRole@odata.bind': '/defra_lobserivceroles(d20e6efe-9954-4c5b-a76c-83a5518a1382)',
          'defra_service@odata.bind': '/defra_lobservices(d20e6efe-9954-4c5b-a76c-83a5518a1381)'
        },
        json: true
      }

      expect(request).to.equal(expectedRequestObj)
    })

    it('should build correct request using required parameters and organisation account id', async () => {
      const { createEnrolment, getToken, getMappings } = idm.dynamics

      const { enrolmentStatus, enrolmentType } = getMappings()
      const token = await getToken()

      const request = await createEnrolment.buildRequest('a20e6efe-9954-4c5b-a76c-83a5518a1385', 'b20e6efe-9954-4c5b-a76c-83a5518a1385', 'c20e6efe-9954-4c5b-a76c-83a5518a1385', 'd20e6efe-9954-4c5b-a76c-83a5518a1385', enrolmentStatus.pending, enrolmentType.other)

      const expectedRequestObj = {
        method: 'POST',
        url: `${dynamicsRoot}/defra_lobserviceuserlinks`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json; charset=utf-8',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          Prefer: 'return=representation'
        },
        body: {
          'defra_connectiondetail@odata.bind': '/defra_connectiondetailses(b20e6efe-9954-4c5b-a76c-83a5518a1385)',
          'defra_ServiceUser@odata.bind': '/contacts(a20e6efe-9954-4c5b-a76c-83a5518a1385)',
          defra_enrolmentstatus: 'c20e6efe-9954-4c5b-a76c-83a5518a1385',
          defra_verified: false,
          'defra_Organisation@odata.bind': '/accounts(d20e6efe-9954-4c5b-a76c-83a5518a1385)',
          'defra_ServiceRole@odata.bind': '/defra_lobserivceroles(OTHER)',
          'defra_service@odata.bind': '/defra_lobservices(2)'
        },
        json: true
      }

      expect(request).to.equal(expectedRequestObj)
    })
  })
})
