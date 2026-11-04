import { stopAll } from "./harness";

export default async function teardown(): Promise<void> {
  await stopAll();
}
