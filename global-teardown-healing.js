require("module-alias/register");

const HealingReport = require("@utils/healingReport");
const config = require("@config");

// Runs once in the main process after all workers finish. Merges the per-worker
// healing events, prints the console summary, and writes the JSON report.
module.exports = async function globalTeardown() {
  HealingReport.loadEventsFromWorkers();
  HealingReport.printSummary();
  HealingReport.writeReport(config.selfHealing.reportPath);
  HealingReport.clearEventsFile();
};
