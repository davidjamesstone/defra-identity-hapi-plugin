const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'demo', '.env') })

const Lab = require('lab')
const Code = require('code')
const lab = exports.lab = Lab.script()

const { describe, it } = lab
const { expect } = Code

const Server = require('../../../server')

const deleteBuilder = require('../../../../lib/methods/dynamics/webApi/delete')

const _buildBaseInternals = () => ({
  dynamics: {
    requestPromise: async () => {},
    buildHeaders: async () => {},
    buildUrl: () => '',
    decodeResponse: () => {}
  }
})

describe('Dynamics - read', async () => {
  let server
  let idm

  // Get instance of server before each test
  lab.before(async () => {
    server = await Server()
    idm = server.methods.idm
  })

  describe(`Given a server with the Hapi plugin has been instantiated`, async () => {
    it(`should contain the deleteEnrolment function on dynamics on the server methods`, async () => {
      expect(idm.dynamics.deleteEnrolment).to.be.a.function()
    })

    describe(`and given the deleteEnrolment method exists and is called`, async () => {
      it(`should return a promise`, async () => {
        const res = idm.dynamics.deleteEnrolment()
        expect(res).to.be.an.instanceOf(Promise)
        try { await res } catch (err) { }
      })
    })
  })

  describe(`Given an lobServiceLinkId`, async () => {
    it(`should make a 'POST' request`, async () => {
      const internals = _buildBaseInternals()
      let spyMethod
      internals.dynamics.requestPromise = async ({ method }) => { spyMethod = method }
      await deleteBuilder({ internals }).deleteEnrolment()
      expect(spyMethod).to.equal('POST')
    })

    it(`should pass the correct stem to buildUrl`, async () => {
      const internals = _buildBaseInternals()
      let spyStem
      internals.dynamics.buildUrl = (stem) => { spyStem = stem }
      const fakeId = 'ABC123'
      await deleteBuilder({ internals }).deleteEnrolment(fakeId)
      expect(spyStem).to.equal('/defra_lobserviceuserlinks(ABC123)/Microsoft.Dynamics.CRM.defra_deleteenrolment')
    })
  })
})
