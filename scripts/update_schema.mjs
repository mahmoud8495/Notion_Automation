const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PROJECTS_DB_ID = "00d127c0-9076-825e-a5c7-0187cf287117";
const PRACTICE_DB_ID = "252127c0-9076-8246-893f-81596062fa94";

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function updateDatabase(dbId, properties) {
  const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ properties }),
  });
  const data = await resp.json();
  if (data.object === "error") {
    throw new Error(`API error updating DB ${dbId}: ${data.message} (${data.code})`);
  }
  return data;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 1: UPDATING PROJECTS DB");
  console.log("═══════════════════════════════════════════════\n");

  try {
    await updateDatabase(PROJECTS_DB_ID, {
      "Is Complete": {
        formula: {
          expression: 'prop("Status") == "Done"'
        }
      }
    });
    console.log("  ✅ Added 'Is Complete' formula to Projects DB.");
  } catch (err) {
    console.log(`  ❌ Failed to update Projects DB: ${err.message}`);
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 2: UPDATING PRACTICE SESSIONS DB");
  console.log("═══════════════════════════════════════════════\n");

  try {
    // 1. Add Phase property and Practice Type categories
    await updateDatabase(PRACTICE_DB_ID, {
      "Phase": {
        select: {
          options: [
            { name: "Phase 1", color: "gray" },
            { name: "Phase 2", color: "brown" },
            { name: "Phase 3", color: "orange" },
            { name: "Phase 4", color: "yellow" }
          ]
        }
      },
      "Practice Type": {
        multi_select: {
          options: [
            { name: "Theory", color: "blue" },
            { name: "Drills", color: "green" },
            { name: "Deep Work", color: "purple" },
            { name: "Project Work", color: "orange" },
            { name: "Review", color: "red" }
          ]
        }
      },
      // Create Project Prerequisites relation
      "Project Prerequisites": {
        relation: {
          database_id: PROJECTS_DB_ID,
          type: "single_property",
          single_property: {}
        }
      }
    });
    console.log("  ✅ Added Phase, simplified Practice Types, and Project Prerequisites relation.");
  } catch (err) {
    console.log(`  ❌ Failed to update Phase/PracticeType/Relation: ${err.message}`);
  }

  await sleep(3000);

  try {
    // 2. Add Rollup (must be done after relation is fully established)
    await updateDatabase(PRACTICE_DB_ID, {
      "Project Prereq Done": {
        rollup: {
          relation_property_name: "Project Prerequisites",
          rollup_property_name: "Is Complete",
          function: "checked"
        }
      }
    });
    console.log("  ✅ Added 'Project Prereq Done' rollup.");
  } catch (err) {
    console.log(`  ❌ Failed to add Rollup: ${err.message}`);
    console.log("  (Note: Notion API sometimes fails to create rollups via API. You may need to create it manually.)");
  }

  await sleep(3000);

  try {
    // 3. Update Availability Formula
    const newFormula = `lets(
  sessionClear, if(empty(prop("Prerequisites")), true, prop("Prerequisite Done") > 0),
  projectClear, if(empty(prop("Project Prerequisites")), true, prop("Project Prereq Done") > 0),
  if(sessionClear and projectClear, "🟢 Available", "🔒 Locked")
)`;

    await updateDatabase(PRACTICE_DB_ID, {
      "Availability": {
        formula: {
          expression: newFormula
        }
      }
    });
    console.log("  ✅ Updated 'Availability' formula with cross-database gating logic.");
  } catch (err) {
    console.log(`  ❌ Failed to update Availability formula: ${err.message}`);
  }

  console.log("\n  Schema update complete.");
}

main().catch(err => console.error("Fatal:", err.message));
