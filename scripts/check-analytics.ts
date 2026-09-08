import { getAnalytics } from "../src/lib/queries";

async function main() {
  const { rates, eventStats } = await getAnalytics();

  console.log(JSON.stringify({ eventStats, rates }, null, 2));
}

main().catch(console.error);
