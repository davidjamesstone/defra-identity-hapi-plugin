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

      if (query.notLoggedInErr) {
        const { next } = query
        const link = idm.generateAuthenticationUrl(next)
        if (next.indexOf('/account/') === 0) { // if we're loading a service account page, redirect to the authentication URL
          return h.redirect(link)
        }
        title = 'Whoops...'
        message = `You need to be logged in to do that. <a href="${link}">Click here to log in or create an account</a>`
      }

      return h.view('error', {
        title,
        message
      })
    }
  }]
