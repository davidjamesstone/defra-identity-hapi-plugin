const debug = require('debug')('defra.identity:methods:dynamics:webApi')

const reads = require('./read')
const creates = require('./create')
const updates = require('./update')
const deletes = require('./delete')

module.exports = (
  {
    server,
    cache,
    config,
    internals
  }) => {
  debug('Registering dynamics server methods...')

  return {
    ...reads(
      {
        server,
        cache,
        config,
        internals
      }),
    ...creates(
      {
        server,
        cache,
        config,
        internals
      }),
    ...updates(
      {
        server,
        cache,
        config,
        internals
      }),
    ...deletes(
      {
        server,
        cache,
        config,
        internals
      }
    )
  }
}
