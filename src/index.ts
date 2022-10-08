import { Lifecycle } from "@well-known-components/interfaces"

import sinon from "sinon"

/**
 * Arguments to be passed to test suites.
 * @public
 */
export type TestArguments<TestComponents extends Record<string, any>> = {
  components: Readonly<TestComponents>
  stubComponents: {
    readonly [T in keyof TestComponents]: sinon.SinonStubbedInstance<TestComponents[T]>
  }
  spyComponents: {
    readonly [T in keyof TestComponents]: SpiedInstance<TestComponents[T]>
  }

  /**
   * Functions to run before the Lifecycle helpers start the components' lifecycle
   */
  beforeStart(fn: BeforeStartFunction<TestComponents>): void
}

/** @public */
export type BeforeStartFunction<TestComponents extends Record<string, any> = any> = () => Promise<void> | void

export { createLocalFetchCompoment, defaultServerConfig } from "./localFetch"

declare var before: typeof beforeAll
declare var after: typeof afterAll

const _beforeAll: typeof beforeAll =
  typeof beforeAll != "undefined" ? beforeAll : typeof before != "undefined" ? before : undefined!
const _afterAll: typeof beforeAll =
  typeof afterAll != "undefined" ? afterAll : typeof after != "undefined" ? after : undefined!

if (!_beforeAll || !_afterAll) {
  throw new Error("Neither before or beforeAll are defined in the globalThis")
}

/**
 * @public
 * @deprecated unstable
 */
export type SpiedInstance<TType extends {}> = {
  [P in keyof TType]: Required<TType>[P] extends (...args: any[]) => any
    ? jest.SpyInstance<ReturnType<Required<TType>[P]>, jest.ArgsType<Required<TType>[P]>>
    : never
}

/**
 * Creates a test runner. Receives the same arguments as Lifecycle.run
 * @public
 */

export function createRunner<TestComponents extends Record<string, any>>(
  options: Lifecycle.ProgramConfig<TestComponents>
) {
  return (name: string, suite: (testArgs: TestArguments<TestComponents>) => void) => {
    let program: Lifecycle.ComponentBasedProgram<TestComponents>
    let sandbox: sinon.SinonSandbox
    const stubComponentInstances = new Map<keyof TestComponents, sinon.SinonStubbedInstance<any>>()
    const spyComponentInstances = new Map<keyof TestComponents, SpiedInstance<any>>()

    function getComponent(key: string) {
      if (!program) throw new Error("Cannot get the components before the test program is initialized")
      if (!program.components) throw new Error("Cannot get the components")
      if (!(key in program.components)) {
        throw new Error("Component " + key + " does not exist")
      }
      return program.components[key]
    }

    function stubComponent(key: string): sinon.SinonStubbedInstance<TestComponents[any]> {
      if (!stubComponentInstances.has(key)) {
        stubComponentInstances.set(key, sinon.stub(getComponent(key)))
      }
      return stubComponentInstances.get(key)!
    }

    /** @deprecated unstable */
    function spyComponent(key: string): SpiedInstance<TestComponents[any]> {
      if (!spyComponentInstances.has(key)) {
        spyComponentInstances.set(key, spy(getComponent(key)))
      }
      return spyComponentInstances.get(key)!
    }

    function spy<T extends {}>(module: T): SpiedInstance<T> {
      const ret = {} as SpiedInstance<T>
      for (let key in module) {
        if (typeof module[key] === "function") {
          ret[key as keyof T] = jest.spyOn(module, key as any) as any
        }
      }
      return ret
    }

    const beforeStartFunctions: BeforeStartFunction[] = []

    const testArgs: TestArguments<TestComponents> = {
      components: new Proxy(
        {},
        {
          get(obj, key) {
            return getComponent(key as any)
          },
        }
      ) as any,
      stubComponents: new Proxy(
        {},
        {
          get(obj, key) {
            return stubComponent(key as any)
          },
        }
      ) as any,
      spyComponents: new Proxy(
        {},
        {
          get(obj, key) {
            return spyComponent(key as any)
          },
        }
      ) as any,
      beforeStart(fn) {
        beforeStartFunctions.push(fn)
      },
    }

    describe(name, () => {
      _beforeAll(async () => {
        jest.resetModules()
        for (let fn of beforeStartFunctions) await fn()
        program = await Lifecycle.run<TestComponents>(options)
      })

      beforeEach(() => {
        sandbox = sinon.createSandbox()

        // reset spy objects
        sinon.reset()
        sinon.resetBehavior()
        jest.resetAllMocks()
        spyComponentInstances.clear()
      })

      afterEach(() => {
        sandbox.restore()
        jest.restoreAllMocks()
      })

      suite(testArgs)

      _afterAll(async () => {
        if (program) {
          await program.stop()
        }
      })
    })
  }
}
