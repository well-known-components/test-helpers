import { Lifecycle } from "@well-known-components/interfaces"
export { createLocalFetchCompoment, defaultServerConfig } from "./localFetch"

export async function runProgram<TestComponents extends Record<string, any>>(
  options: Lifecycle.ProgramConfig<TestComponents>
): Promise<Lifecycle.ComponentBasedProgram<TestComponents>> {
  return Lifecycle.run<TestComponents>(options)
}
