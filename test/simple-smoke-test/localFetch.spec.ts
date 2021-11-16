import { createServerComponent, IFetchComponent, Router } from "@well-known-components/http-server"
import { IHttpServerComponent } from "@well-known-components/interfaces"

import expect from "expect"
import { createRunner } from "../../src"
import { createLocalFetchCompoment, defaultServerConfig } from "../../src/localFetch"

type Components = {
  fetch: IFetchComponent,
  server: IHttpServerComponent<GlobalContext>
}
type GlobalContext = {
  components: Components
}

const logs = {
  getLogger: (a: string) => ({
    log: (message: string) => {},
    error: (error: string | Error) => {},
    debug: (message: string) => {},
    info: (message: string) => {},
    warn: (message: string) => {},
  })
}
const configMap = defaultServerConfig()
const config = {
  getString: async (a: string) => a,
  getNumber: async (a: string) => Number(a),
  requireNumber: async (a: keyof typeof configMap) => Number(configMap[a])!,
  requireString: async (a: keyof typeof configMap) => configMap[a]!,
}

const ROUTE_URL = '/some-route'
const RESPONSE = { someProp: true }

const test = createRunner<Components>({
  async main({ startComponents, components }) {
    const router = new Router<GlobalContext>()

    router.get(ROUTE_URL, async (_ctx) => {
     return { status: 200, body: RESPONSE }
    })

    components.server.use(router.allowedMethods())
    components.server.use(router.middleware())

    components.server.setContext({ components })

    await startComponents()
  },
  async initComponents() {
    return {
      fetch: await createLocalFetchCompoment(config),
      server: await createServerComponent<GlobalContext>({ config, logs }, {})
    }
  },
})

test("test local fetch component", ({ components, stubComponents }) => {
  it("should return response json", async () => {
    const { fetch } = components
    const response = await (await fetch.fetch(ROUTE_URL)).json()

    expect(response).toStrictEqual(RESPONSE)
  })

  it("sould fail if its an external url", async () => {
    const { fetch } = components
    try {
      await fetch.fetch('https://some-route.com')
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toBe('localFetch only works for local testing-URLs')
      }
    }
  })
})
