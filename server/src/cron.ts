import cron from "node-cron";
import prisma from "./lib/prisma";

export function startCronJobs() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await prisma.user.updateMany({
        where: {
          isLooking: true,
          lookingExpiry: { lte: new Date() },
        },
        data: {
          isLooking: false,
          lookingExpiry: null,
        },
      });
      if (result.count > 0) {
        console.log(`[CRON] Auto-disabled looking status for ${result.count} users`);
      }
    } catch (error) {
      console.error("[CRON] Error cleaning looking status:", error);
    }
  });

  console.log("[CRON] Jobs started");
}
