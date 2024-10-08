import nodeFetch, { RequestInfo, RequestInit } from 'node-fetch'
import * as http from 'http'

import { IFetchComponent, IConfigComponent } from '@well-known-components/interfaces'

// start TCP port for listeners
/* istanbul ignore next */
let lastUsedPort = 19000 + parseInt(process.env.JEST_WORKER_ID || '1') * 1000

function getPort() {
  lastUsedPort += 1
  return lastUsedPort
}

/**
 * Default Server config
 * @public
 **/
export const defaultServerConfig = () => ({
  HTTP_SERVER_HOST: '0.0.0.0',
  HTTP_SERVER_PORT: String(getPort())
})

/**
 * Local Fetch component for testing local urls
 * @public
 **/
export async function createLocalFetchCompoment(configComponent: IConfigComponent): Promise<IFetchComponent> {
  const protocolHostAndProtocol = `http://${await configComponent.requireString(
    'HTTP_SERVER_HOST'
  )}:${await configComponent.requireNumber('HTTP_SERVER_PORT')}`

  const agent = new http.Agent({ keepAlive: false })
  // test fetch, to hit our local server
  const localFetch: IFetchComponent = {
    async fetch(url: RequestInfo, initRequest?: RequestInit) {
      if (typeof url == 'string' && url.startsWith('/')) {
        return nodeFetch(protocolHostAndProtocol + url, { agent, ...initRequest })
      } else {
        throw new Error('localFetch only works for local testing-URLs')
      }
    }
  }
  return localFetch
}
