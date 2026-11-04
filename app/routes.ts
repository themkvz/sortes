import { get, post, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  readingClear: post('/reading-state/clear'),
  readingSeal: post('/reading-state/seal'),
  sharedReading: get('/r/:payload'),
})
