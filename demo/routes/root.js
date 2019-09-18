const serviceLookup = require('../lib/services')
module.exports = [
  {
    method: 'GET',
    path: '/',
    options: {
      auth: false
    },
    handler: async function (request, h) {
      const { idm } = request.server.methods

      return h.view('index', {
        title: 'home',
        user: null,
        idm,
        serviceLookup,
        claims: await idm.getClaims(request)
      })
    }
  }]
