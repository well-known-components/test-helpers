import expect from "expect"
import { createRunner } from "../../src"

type Components = {
  component: {
    start(): Promise<any>
    stop(): Promise<any>
    sum(a: number, b: number): number
    read(): { started: boolean; stopped: boolean; counter: number }
  }
}

const test = createRunner<Components>({
  async main(program) {
    await program.startComponents()
  },
  async initComponents() {
    let started = false
    let stopped = false
    let counter = 0
    const componentB = {
      async start() {
        started = true
      },
      async stop() {
        stopped = true
      },
      sum(a: number, b: number) {
        counter++
        return a + b
      },
      read() {
        return { started, stopped, counter }
      },
    }

    return { component: componentB }
  },
})

test("mocking component with lifecycle", ({ components, stubComponents }) => {
  it("calls the original component", () => {
    const { component } = components
    expect(component.sum(1, 1)).toEqual(2)
  })
  it("stub a call", () => {
    const { component } = stubComponents
    component.sum.returns(1)
    expect(component.sum(1, 1)).toEqual(1)
  })
  it("should start every component, no matter if those are stubbed", () => {
    expect(stubComponents.component.read.wrappedMethod()).toEqual({
      started: true,
      counter: 1,
      stopped: false,
    })
  })
})
