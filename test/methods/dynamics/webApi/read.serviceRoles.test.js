const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'demo', '.env') })

const Lab = require('lab')
const Code = require('code')
const lab = exports.lab = Lab.script()

const { describe, it } = lab
const { expect } = Code

const readApi = require('../../../../lib/methods/dynamics/webApi/read')

const { readServiceRoles } = readApi({
  server: {},
  dynamics: null,
  config: null,
  internals: {dynamics: {
    requestPromise: request => new Promise((resolve, reject) => resolve(request)),
    buildHeaders: x => x,
    buildUrl: (_, params) => params
  } }
})

describe('Dynamics web API read service roles function', () => {
  it('URL filter param is created against a single service ID', async () => {
    const result = await readServiceRoles('0000')
    expect(result.url['$filter']).to.equal('_defra_lobservice_value eq 0000')
  })

  it('URL filter param is created against a single service ID from array with single element', async () => {
    const result = await readServiceRoles(['0000'])
    expect(result.url['$filter']).to.equal('_defra_lobservice_value eq 0000')
  })

  it('URL filter param is created against an array of two service IDs', async () => {
    const expected = '_defra_lobservice_value eq 0000 or _defra_lobservice_value eq 1111'
    const result = await readServiceRoles(['0000', '1111'])
    expect(result.url['$filter']).to.equal(expected)
  })

  it('URL filter param is created against an array of three service IDs', async () => {
    const expected = '_defra_lobservice_value eq 0000 or _defra_lobservice_value eq 1111 or _defra_lobservice_value eq 2222'
    const result = await readServiceRoles(['0000', '1111', '2222'])
    expect(result.url['$filter']).to.equal(expected)
  })
})
