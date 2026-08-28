const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PRACTICE_DB_ID = "252127c0-9076-8246-893f-81596062fa94";
const PROJECTS_DB_ID = "00d127c0-9076-825e-a5c7-0187cf287117";

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
  if (data.object === "error") throw new Error(`${data.message}`);
  return data;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 1: ADD '✅ Finished Tasks' TO PHASE");
  console.log("═══════════════════════════════════════════════\n");

  let phaseOptions = [];
  try {
    const dbResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, { headers: HEADERS });
    const dbData = await dbResp.json();
    phaseOptions = dbData.properties["Phase"].select.options;
    
    // Check if it already exists to avoid duplication
    if (!phaseOptions.find(o => o.name === "✅ Finished Tasks")) {
      phaseOptions.push({ name: "✅ Finished Tasks", color: "green" });
    }
    
    await updateDatabase(PRACTICE_DB_ID, {
      "Phase": {
        select: {
          options: phaseOptions
        }
      }
    });
    console.log("  ✅ Added '✅ Finished Tasks' to Phase options.");
  } catch (err) {
    console.log(`  ❌ Failed to update Phase options: ${err.message}`);
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 2: REMOVE TEMP 'BOARD COLUMN' & RENAME OUTPUT");
  console.log("═══════════════════════════════════════════════\n");
  
  try {
    // Delete Board column by setting it to null
    await updateDatabase(PRACTICE_DB_ID, {
      "Board Column": null,
      "Output Produced": { name: "Output Produced (Manual)" }
    });
    console.log("  ✅ Removed 'Board Column' and renamed original checkbox.");
  } catch(err) {
    console.log(`  ❌ Failed to remove Board Column: ${err.message}`);
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 3: CREATE NEW OUTPUT FORMULA");
  console.log("═══════════════════════════════════════════════\n");

  try {
    // Create new formula property for Output Produced
    await updateDatabase(PRACTICE_DB_ID, {
      "Output Produced": {
        formula: {
          expression: 'prop("Phase") == "✅ Finished Tasks"'
        }
      }
    });
    console.log("  ✅ Created new 'Output Produced' formula.");
  } catch(err) {
    console.log(`  ❌ Failed to create formula: ${err.message}`);
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 4: UPDATE ROLLUPS IN BOTH DBS");
  console.log("═══════════════════════════════════════════════\n");

  try {
    // 1. Update Prerequisite Done in Practice Sessions
    await updateDatabase(PRACTICE_DB_ID, {
      "Prerequisite Done": {
        rollup: {
          relation_property_name: "Prerequisites",
          rollup_property_name: "Output Produced",
          function: "checked"
        }
      }
    });
    console.log("  ✅ Updated Prerequisite Done rollup to point to the new formula.");
  } catch(err) {
    console.log(`  ❌ Failed to update Prerequisite Done rollup: ${err.message}`);
  }

  await sleep(2000);

  try {
    // 2. Update Required Sessions Done in Projects
    await updateDatabase(PROJECTS_DB_ID, {
      "Required Sessions Done": {
        rollup: {
          relation_property_name: "Required Sessions",
          rollup_property_name: "Output Produced",
          function: "percent_checked"
        }
      }
    });
    console.log("  ✅ Updated Required Sessions Done rollup to point to the new formula.");
  } catch(err) {
    console.log(`  ❌ Failed to update Projects rollup: ${err.message}`);
  }

  console.log("\n  All done! Drag-and-drop mechanics are live.");
}

main().catch(console.error);
