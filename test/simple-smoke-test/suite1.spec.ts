import expect from "expect"
import sinon from "sinon"
import { createRunner } from "../../src"

type Components = {
  componentA: {
    functionThatThrows(): void
  }
  componentB: {
    sum(a: number, b: number): number
    counter(): number
  }
}

const test = createRunner<Components>({
  async main(program) {
    await program.startComponents()
  },
  async initComponents() {
    let counter = 0

    const componentA = {
      functionThatThrows() {
        throw new Error("ABC")
      },
    }
    const componentB = {
      sum(a: number, b: number) {
        counter++
        return a + b
      },
      counter() {
        return counter
      },
    }

    return { componentA, componentB }
  },
})

test("mocking component A", ({ components, stubComponents }) => {
  it("tests without mock", async () => {
    const { componentA } = components
    expect(() => componentA.functionThatThrows()).toThrow("ABC")
  })
  it("tests with mock", async () => {
    const { componentA } = stubComponents
    componentA.functionThatThrows.withArgs().throwsException(new Error("XYZ"))
    expect(() => componentA.functionThatThrows()).toThrow("XYZ")
    expect(componentA.functionThatThrows.calledOnce).toEqual(true)
  })
})

test("mocking component B", ({ components, stubComponents }) => {
  // this should throw because we are at "test declaration stage" and components don't exist yet
  expect(() => components.componentB.sum(1, 2)).toThrow(
    "Cannot get the components before the test program is initialized"
  )

  it("tests without mock", async () => {
    const { componentB } = components
    expect(componentB.counter()).toEqual(0)
    expect(componentB.sum(1, 2)).toEqual(3)
    expect(componentB.counter()).toEqual(1)
  })

  it("same components instances should be used inside tests of the same run", async () => {
    const { componentB } = components
    expect(componentB.counter()).toEqual(1)
  })

  it("tests with mock", async () => {
    const { componentB } = stubComponents
    componentB.sum.withArgs(1, 2).returns(4)
    expect(componentB.sum(1, 2)).toEqual(4)
    expect(componentB.sum.calledOnce).toEqual(true)
  })
})

test("logic tests", ({ components, stubComponents }) => {
  it("new components should be created for each test run", async () => {
    const { componentB } = components
    // the previous tests incremented the counter
    expect(componentB.counter()).toEqual(0)
  })
  it("stubs could be used many times inside the same 'it'", async () => {
    const { componentB } = stubComponents
    componentB.counter.returns(12)
    expect(componentB.counter()).toEqual(12)
    componentB.counter.returns(15)
    expect(componentB.counter()).toEqual(15)
    // even without deconstructor
    stubComponents.componentB.counter.returns(19)
    expect(componentB.counter()).toEqual(19)
  })
  it("stubs should reset between test cases", async () => {
    expect(components.componentB.counter()).toEqual(undefined)
  })

  it("accessing stub and real components should yield the same results", async () => {
    stubComponents.componentB.counter.returns(33)
    expect(components.componentB.counter()).toEqual(33)

    expect(components.componentB).toEqual(stubComponents.componentB)
  })

  it("stub methods should be restorable", async () => {
    stubComponents.componentB.counter.restore()
    expect(stubComponents.componentB.counter()).toEqual(0)
  })
  it("restored stubs should remain that way between test cases", async () => {
    expect(stubComponents.componentB.counter()).toEqual(0)
  })
  it("restored stubs should be re-stubabble", async () => {
    sinon.stub(stubComponents.componentB, "counter")

    stubComponents.componentB.counter.returns(33)
    expect(components.componentB.counter()).toEqual(33)
  })
})
