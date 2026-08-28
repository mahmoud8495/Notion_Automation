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
  if (data.object === "error") throw new Error(`${data.message}`);
  return data;
}

async function updatePage(pageId, properties) {
  const resp = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
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

const PROJECTS = {
  syncBuck: "3c9127c0-9076-8098-9140-de481b4a9480",
  smartMedia: "3c9127c0-9076-802f-9c07-c7525db32639",
  adsbLna: "3ca127c0-9076-815f-ba43-d86b72a63955"
};

const SESSIONS = {
  hotLoop: "bfd127c0-9076-820f-b11c-01e6172b8e57", // Last of Phase 1
  keepOut: "3c9127c0-9076-808a-965c-cf3405cf5684", // Last of Phase 2
  rfVia: "3c9127c0-9076-8067-810d-ea5794f8167a"    // Last of Phase 3
};

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 1: ADD REQUIRED SESSIONS TO PROJECTS DB");
  console.log("═══════════════════════════════════════════════\n");

  try {
    await updateDatabase(PROJECTS_DB_ID, {
      "Required Sessions": {
        relation: {
          database_id: PRACTICE_DB_ID,
          type: "single_property",
          single_property: {}
        }
      }
    });
    console.log("  ✅ Added 'Required Sessions' relation to Projects DB.");
  } catch (err) {
    console.log(`  ❌ Error adding relation: ${err.message}`);
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 2: ADD ROLLUP AND AVAILABILITY FORMULA");
  console.log("═══════════════════════════════════════════════\n");

  try {
    await updateDatabase(PROJECTS_DB_ID, {
      "Required Sessions Done": {
        rollup: {
          relation_property_name: "Required Sessions",
          rollup_property_name: "Output Produced",
          function: "percent_checked"
        }
      }
    });
    console.log("  ✅ Added 'Required Sessions Done' rollup to Projects DB.");
  } catch (err) {
    console.log(`  ❌ Error adding rollup: ${err.message}`);
    // Fallback to try checked if percent_checked fails
    try {
      await updateDatabase(PROJECTS_DB_ID, {
        "Required Sessions Done": {
          rollup: {
            relation_property_name: "Required Sessions",
            rollup_property_name: "Output Produced",
            function: "checked"
          }
        }
      });
      console.log("  ✅ Added 'Required Sessions Done' rollup (fallback to checked).");
    } catch(err2) {
      console.log(`  ❌ Fallback also failed: ${err2.message}`);
    }
  }

  await sleep(2000);

  try {
    // If the rollup is empty (no required sessions), it's Available.
    // Otherwise, if the percent is 1 (100%), it's Available.
    // If we fell back to checked, we assume > 0 is enough since we'll only link 1 session for now.
    const formulaStr = `if(empty(prop("Required Sessions")), "🟢 Available", if(prop("Required Sessions Done") > 0, "🟢 Available", "🔒 Locked"))`;
    
    await updateDatabase(PROJECTS_DB_ID, {
      "Availability": {
        formula: {
          expression: formulaStr
        }
      }
    });
    console.log("  ✅ Added 'Availability' formula to Projects DB.");
  } catch (err) {
    console.log(`  ❌ Error adding formula: ${err.message}`);
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 3: LINK PROJECTS TO GATEWAY SESSIONS");
  console.log("═══════════════════════════════════════════════\n");

  try {
    await updatePage(PROJECTS.syncBuck, {
      "Required Sessions": { relation: [{ id: SESSIONS.hotLoop }] }
    });
    console.log("  ✅ Linked Synchronous BUCK -> Requires Hot Loop Minimization (End of P1).");

    await updatePage(PROJECTS.smartMedia, {
      "Required Sessions": { relation: [{ id: SESSIONS.keepOut }] }
    });
    console.log("  ✅ Linked Smart Media Display -> Requires Antenna Keep-Out (End of P2).");

    await updatePage(PROJECTS.adsbLna, {
      "Required Sessions": { relation: [{ id: SESSIONS.rfVia }] }
    });
    console.log("  ✅ Linked 1090 MHz ADS-B -> Requires RF Via Fencing (End of P3).");

  } catch (err) {
    console.log(`  ❌ Error linking projects: ${err.message}`);
  }
}

main().catch(console.error);
