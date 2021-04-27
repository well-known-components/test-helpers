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
    }

    describe(name, () => {
      before(async () => {
        program = await Lifecycle.run<TestComponents>(options)
      })

      beforeEach(() => {
        sandbox = sinon.createSandbox()

        // reset spy objects
        sinon.reset()
        sinon.resetBehavior()
      })

      afterEach(() => {
        sandbox.restore()
      })

      suite(testArgs)

      after(async () => {
        if (program) {
          await program.stop()
        }
      })
    })
  }
}
