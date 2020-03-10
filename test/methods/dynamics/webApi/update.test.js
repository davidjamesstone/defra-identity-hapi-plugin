const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'demo', '.env') })

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()

const { describe, it } = lab
const { expect } = Code

const Server = require('../../../server')

describe('Dynamics - update', async () => {
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

  describe('Update enrolment', async () => {
    it('should build correct request using required parameters', async () => {
      const { updateEnrolmentStatus, getToken, getMappings } = idm.dynamics

      const { enrolmentStatus } = getMappings()
      const token = await getToken()

      const request = await updateEnrolmentStatus.buildRequest('a20e6efe-9954-4c5b-a76c-83a5518a1385', enrolmentStatus.completeApproved)

      const expectedRequestObj = {
        method: 'POST',
        url: `${dynamicsRoot}/defra_lobserviceuserlinks(a20e6efe-9954-4c5b-a76c-83a5518a1385)/Microsoft.Dynamics.CRM.defra_updateenrolment`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json; charset=utf-8',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          Prefer: 'odata.maxpagesize=500, odata.include-annotations="*"'
        },
        body: {
          UpdateEnrolmentStatus: 3
        },
        json: true
      }

      expect(request).to.equal(expectedRequestObj)
    })
  })
})
