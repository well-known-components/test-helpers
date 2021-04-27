import { createRunner } from "../src"
import expect from "expect"

describe("unit", () => {
  it("smoke test", () => {
    expect(typeof createRunner).toEqual("function")
  })
})
