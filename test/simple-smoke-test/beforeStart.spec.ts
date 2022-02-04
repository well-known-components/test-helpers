import { createRunner } from "../../src"

type Components = {
  config: {
    readonly getValue: string
  }
}

const AAA_VALUE = Math.random().toString()

const test = createRunner<Components>({
  async main(program) {
    await program.startComponents()
  },
  async initComponents() {
    const config = {
      start() {
        expect(process.env.AAA).toEqual(AAA_VALUE)
      },
      get getValue() {
        expect(process.env.AAA).toEqual(AAA_VALUE)
        return process.env.AAA!
      },
    }

    return { config }
  },
})

test("beforeStart works", ({ beforeStart, components }) => {
  beforeStart(async () => {
    process.env.AAA = AAA_VALUE
  })
  it("works", () => {
    expect(components.config.getValue).toEqual(AAA_VALUE)
    delete process.env.AAA
  })
})