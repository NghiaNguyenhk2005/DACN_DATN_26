import { startAll } from "./harness";

export default async function setup(): Promise<void> {
  const servers = await startAll();
  process.env.BB_MAIN = servers.main;
  process.env.BB_PROD = servers.prod;
  process.env.BB_TIGHT = servers.tight;
  process.env.BB_PROD_ORIGIN = servers.prodOrigin;
  process.env.BB_MAILBOX = servers.mailbox;
  process.env.BB_PROD_SECRET = servers.prodSecret;
}
