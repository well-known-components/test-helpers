import expect from "expect"
import { createRunner } from "../../src"

type Components = {
  componentA: {
    functionThatThrows(): void
  }
  componentB: {
    sum(a: number, b: number): number
    counter(): number
    t: number
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
      t: 3
    }

    return { componentA, componentB }
  },
})

if (typeof jest != "undefined") {
  test("mocking component A", ({ components }) => {
    it("tests without mock", async () => {
      const { componentA } = components
      expect(() => componentA.functionThatThrows()).toThrow("ABC")
    })
    it("tests with mock", async () => {
      const { componentA } = components
      const spy1 = jest.spyOn(componentA, "functionThatThrows")
      spy1.mockImplementation(() => {
        throw new Error("XYZ")
      })
      expect(() => componentA.functionThatThrows()).toThrow("XYZ")
      expect(spy1).toHaveBeenCalledTimes(1)
    })
  })
}

test("mocking component B", ({ components }) => {
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
  if (typeof jest != "undefined") {
    it("tests with mock", async () => {
      const { componentB } = components
      const spy1 = jest.spyOn(componentB, "sum")
      spy1.mockImplementation((a, b) => {
        return 4
      })
      expect(componentB.sum(1, 2)).toEqual(4)
      expect(spy1).toHaveBeenCalledTimes(1)
    })
  }
})



test("mocking component with spy", ({ components, spyComponents }) => {
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
  if (typeof jest != "undefined") {
    it("tests with mock", async () => {
      const { componentB } = components
      spyComponents.componentB.sum.mockImplementation((a, b) => {
        return 4
      })
      expect(componentB.sum(1, 2)).toEqual(4)
      expect(componentB.sum).toHaveBeenCalledTimes(1)
    })
    it("tests with mock resets", async () => {
      const { componentB } = components
      spyComponents.componentB.sum.mockImplementation((a, b) => {
        return 4
      })
      expect(componentB.sum(1, 2)).toEqual(4)
      expect(componentB.sum).toHaveBeenCalledTimes(1)
    })
  }
})
