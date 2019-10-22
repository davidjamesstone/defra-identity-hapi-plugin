module.exports = [
  {
    method: 'GET',
    path: '/error',
    options: {
      auth: false
    },
    handler: function (request, h) {
      const { query, server } = request

      const { idm } = server.methods

      let title = 'Whoops...'
      let message = 'An unexpected error has occurred'
      let stack// = query.stack ? JSON.parse(query.stack) : undefined

      if (query.notLoggedInErr) {
        const { next } = query

        title = 'Whoops...'
        const link = idm.generateAuthenticationUrl(next)
        if (next.indexOf('/account/') === 0) {
          return h.redirect(link)
        }
        message = `You need to be logged in to do that. <a id="clickyLink" href="${link}">Click here to log in or create an account</a>`
      }

      return h.view('error', {
        title,
        message,
        stack
      })
    }
  }]
