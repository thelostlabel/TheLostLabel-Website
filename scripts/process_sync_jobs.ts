import "dotenv/config";

import { processSyncJobs } from "@/lib/sync-jobs";

async function main() {
  const limit = Number.parseInt(process.argv[2] || "5", 10) || 5;
  await processSyncJobs(limit);
}

main().catch((error) => {
  console.error("[process_sync_jobs] failed:", error);
  process.exit(1);
});
