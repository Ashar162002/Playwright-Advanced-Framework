const fs = require("fs");
const path = require("path");
const config = require("@config");

const EVENTS_DIR = path.resolve(process.cwd(), config.selfHealing.reportPath);
const EVENTS_FILE_PREFIX = "healing-events";

// Playwright runs specs across worker processes, so healing events are streamed
// to per-process NDJSON files and merged by the global teardown in the main
// process. This avoids losing heals recorded outside the reporter's process.
class HealingReport {
  static events = [];

  static _processEventFile() {
    return path.join(EVENTS_DIR, `${EVENTS_FILE_PREFIX}.${process.pid}.ndjson`);
  }

  static addEvent(event) {
    this.events.push(event);
    try {
      fs.mkdirSync(EVENTS_DIR, { recursive: true });
      fs.appendFileSync(this._processEventFile(), `${JSON.stringify(event)}\n`);
    } catch (error) {
      console.warn(`HealingReport: could not persist event: ${error.message}`);
    }
  }

  static loadEventsFromWorkers() {
    if (!fs.existsSync(EVENTS_DIR)) return;
    try {
      const files = fs
        .readdirSync(EVENTS_DIR)
        .filter((f) => f.startsWith(EVENTS_FILE_PREFIX) && f.endsWith(".ndjson"));
      for (const file of files) {
        const content = fs.readFileSync(path.join(EVENTS_DIR, file), "utf8");
        for (const line of content.trim().split("\n").filter(Boolean)) {
          try {
            this.events.push(JSON.parse(line));
          } catch {
            /* skip malformed line */
          }
        }
      }
    } catch (error) {
      console.warn(`HealingReport: could not load events: ${error.message}`);
    }
  }

  static clearEventsFile() {
    if (!fs.existsSync(EVENTS_DIR)) return;
    try {
      const files = fs
        .readdirSync(EVENTS_DIR)
        .filter((f) => f.startsWith(EVENTS_FILE_PREFIX) && f.endsWith(".ndjson"));
      for (const file of files) {
        fs.unlinkSync(path.join(EVENTS_DIR, file));
      }
    } catch {
      /* best effort cleanup */
    }
  }

  static getSummary() {
    const total = this.events.length;
    if (total === 0) return { totalHealed: 0 };

    const avgConfidence =
      this.events.reduce((sum, e) => sum + e.finalConfidence, 0) / total;
    const consensusCount = this.events.filter((e) => (e.consensusVotes || 1) >= 2).length;
    const aiCount = this.events.filter((e) => e.aiUsed).length;
    const avgTime =
      this.events.reduce((sum, e) => sum + (e.healingTimeMs || 0), 0) / total;

    const strategyCounts = {};
    for (const event of this.events) {
      const strategy = (event.consensusVotes || 1) >= 2 ? "consensus" : event.strategy;
      strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
    }

    return {
      totalHealed: total,
      averageConfidence: Number.parseFloat(avgConfidence.toFixed(3)),
      consensusRate: `${((consensusCount / total) * 100).toFixed(1)}%`,
      aiTieBreakerUsed: aiCount,
      averageHealingTimeMs: Math.round(avgTime),
      strategyCounts,
    };
  }

  static writeReport(outputDir) {
    if (this.events.length === 0) return;

    const resolvedDir = path.resolve(process.cwd(), outputDir || EVENTS_DIR);
    if (!resolvedDir.startsWith(process.cwd())) {
      console.warn(`HealingReport: "${outputDir}" is outside the project, using default`);
      return this.writeReport(null);
    }

    fs.mkdirSync(resolvedDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      healingEvents: this.events,
    };

    const filePath = path.join(resolvedDir, "healing-report.json");
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`Healing report written to: ${filePath}`);
  }

  static printSummary() {
    if (this.events.length === 0) {
      console.log("\n=== Self-Healing Report: no locators needed healing ===\n");
      return;
    }

    const summary = this.getSummary();
    console.log("\n========================================");
    console.log("            Self-Healing Report");
    console.log("========================================");
    console.log(`Healed: ${summary.totalHealed} locator(s)`);
    console.log(`Average confidence: ${summary.averageConfidence}`);
    console.log(`Consensus achieved: ${summary.consensusRate}`);
    console.log(`AI tie-breaker used: ${summary.aiTieBreakerUsed} time(s)`);
    console.log(`Average healing time: ${summary.averageHealingTimeMs}ms`);
    console.log("");
    console.log("Healed locators:");

    for (const event of this.events) {
      const name =
        event.locatorName && event.locatorName !== "unknown"
          ? ` [${event.locatorName}]`
          : "";
      console.log(`  ${name} "${event.originalSelector}" -> "${event.healedSelector}"`);
      console.log(
        `     strategy: ${event.strategy}, votes: ${event.consensusVotes || 1}, ` +
          `confidence: ${event.finalConfidence.toFixed(2)}, time: ${event.healingTimeMs}ms`
      );
    }

    console.log("");
    console.log("Update these locators to remove future healing overhead.");
    console.log("========================================\n");
  }

  static reset() {
    this.events = [];
  }
}

module.exports = HealingReport;
