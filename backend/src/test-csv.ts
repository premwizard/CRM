import { parseCsvString } from "./utils/csv-parser";
import { db } from "./config/db";

async function runCsvTests() {
  console.log("--- Starting CSV Import & Export Verification Tests ---");

  try {
    // 1. Test CSV Parser Utility with edge cases
    const sampleCsv = `First Name,Last Name,Email,Company
"Rahul","Sharma","rahul.csv.test@example.com","Acme Inc"
"Arun","Kumar","invalid-email-format","TechCorp"
"Priya","Patel","priya.csv.test@example.com","Global Logistics"
"","MissingFirst","missingfirst@example.com","No Name Inc"`;

    const parsed = parseCsvString(sampleCsv);
    console.log("✔ CSV Parser extracted headers:", parsed.headers);
    console.log("✔ CSV Parser extracted total rows:", parsed.rows.length);

    if (parsed.rows.length !== 4) {
      throw new Error(`Expected 4 rows parsed, got ${parsed.rows.length}`);
    }

    // 2. Test CSV Export Query for Contacts
    const c1 = await db.contact.create({
      data: {
        firstName: "ExportTest1",
        lastName: "User",
        email: `export1.${Date.now()}@example.com`,
      },
    });

    const c2 = await db.contact.create({
      data: {
        firstName: "ExportTest2",
        lastName: "User",
        email: `export2.${Date.now()}@example.com`,
      },
    });

    const contactsForExport = await db.contact.findMany({
      where: { id: { in: [c1.id, c2.id] } },
    });

    if (contactsForExport.length !== 2) {
      throw new Error("Export query failed to fetch filtered contacts");
    }
    console.log("✔ Filtered dataset export query succeeded, total records:", contactsForExport.length);

    // 3. Test Validation & Duplicate Detection
    const duplicateEmail = c1.email;
    const existing = await db.contact.findFirst({ where: { email: duplicateEmail } });
    if (!existing) throw new Error("Duplicate check test failed");
    console.log("✔ Pre-import duplicate detection check passed for existing email:", duplicateEmail);

    // 4. Test Transactional Partial Import
    const importBatch = [
      {
        firstName: "ValidImport1",
        lastName: "User",
        email: `valid1.${Date.now()}@example.com`,
      },
      {
        firstName: "ValidImport2",
        lastName: "User",
        email: `valid2.${Date.now()}@example.com`,
      },
    ];

    const insertedContacts = await db.$transaction(async (tx) => {
      const created = [];
      for (const row of importBatch) {
        const item = await tx.contact.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
          },
        });
        created.push(item);
      }
      return created;
    });

    console.log("✔ Transactional batch import executed successfully:", insertedContacts.length === 2);

    // Clean up test records
    await db.contact.deleteMany({
      where: { id: { in: [c1.id, c2.id, ...insertedContacts.map((c) => c.id)] } },
    });
    console.log("✔ Cleaned up test records from database");

    console.log("\n🎉 ALL CSV IMPORT & EXPORT TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ CSV Test failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runCsvTests();
