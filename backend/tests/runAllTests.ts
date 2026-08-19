import { execSync } from "child_process";
import path from "path";

const testFiles = [
  "test-rbac.ts",
  "test-tenant-isolation.ts",
  "test-analytics.ts",
  "test-attachments.ts",
  "test-audit.ts",
  "test-bulk.ts",
  "test-comments.ts",
  "test-crm-config.ts",
  "test-csv.ts",
  "test-email.ts",
  "test-meetings.ts",
  "test-notifications.ts",
  "test-team.ts",
];

async function runAllTests() {
  console.log("=================================================");
  console.log("🚀 IC CRM Automated Backend Integration Test Suite");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;
  const results: { file: string; status: "PASS" | "FAIL"; durationMs: number }[] = [];

  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    const startTime = Date.now();
    console.log(`▶ Running test suite: ${file}...`);

    try {
      execSync(`npx tsx "${filePath}"`, {
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "test" },
      });
      const durationMs = Date.now() - startTime;
      results.push({ file, status: "PASS", durationMs });
      passed++;
      console.log(`✅ ${file} PASSED (${durationMs}ms)\n`);
    } catch {
      const durationMs = Date.now() - startTime;
      results.push({ file, status: "FAIL", durationMs });
      failed++;
      console.log(`❌ ${file} FAILED (${durationMs}ms)\n`);
    }
  }

  console.log("=================================================");
  console.log("📊 TEST SUITE RESULTS SUMMARY");
  console.log("=================================================");
  results.forEach((r) => {
    const badge = r.status === "PASS" ? "✅ PASS" : "❌ FAIL";
    console.log(`${badge} - ${r.file} (${r.durationMs}ms)`);
  });
  console.log(`\nTotal: ${testFiles.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error("\n❌ Some tests failed!");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL BACKEND INTEGRATION TESTS PASSED!");
    process.exit(0);
  }
}

runAllTests();
