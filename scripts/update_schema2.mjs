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
    throw new Error(`${data.message}`);
  }
  return data;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 1: ADD 'PHASE' & 'PROJECT PREREQS'");
  console.log("═══════════════════════════════════════════════\n");

  try {
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
      "Project Prerequisites": {
        relation: {
          database_id: PROJECTS_DB_ID,
          type: "single_property",
          single_property: {}
        }
      }
    });
    console.log("  ✅ Added Phase and Project Prerequisites relation.");
  } catch (err) {
    console.log(`  ❌ Failed to add Phase/Relation: ${err.message}`);
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 2: ADD ROLLUP");
  console.log("═══════════════════════════════════════════════\n");

  try {
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
  }

  await sleep(2000);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 3: UPDATE AVAILABILITY FORMULA");
  console.log("═══════════════════════════════════════════════\n");

  try {
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
    console.log("  ✅ Updated 'Availability' formula.");
  } catch (err) {
    console.log(`  ❌ Failed to update Availability formula: ${err.message}`);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 4: GET PRACTICE TYPE IDs TO RENAME");
  console.log("═══════════════════════════════════════════════\n");
  
  // We need to fetch the exact IDs of existing options to change their color/name
  const dbResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, { headers: HEADERS });
  const dbData = await dbResp.json();
  const options = dbData.properties["Practice Type"].multi_select.options;
  
  const updatedOptions = [];
  
  // Keep IDs but update names/colors where appropriate
  for (const opt of options) {
    if (opt.name === "Deep work") updatedOptions.push({ id: opt.id, name: "Deep Work", color: "purple" });
    else if (opt.name === "Drills") updatedOptions.push({ id: opt.id, name: "Drills", color: "green" }); // changed from yellow to green
    else if (opt.name === "Research") updatedOptions.push({ id: opt.id, name: "Theory", color: "blue" }); // renamed from Research
    else if (opt.name === "Project work") updatedOptions.push({ id: opt.id, name: "Project Work", color: "orange" }); // changed from blue to orange
    else if (opt.name === "Review") updatedOptions.push({ id: opt.id, name: "Review", color: "red" }); // changed from gray to red
  }
  
  // Add new options that don't exist yet
  updatedOptions.push({ name: "Meta", color: "gray" });
  
  try {
    await updateDatabase(PRACTICE_DB_ID, {
      "Practice Type": {
        multi_select: {
          options: updatedOptions
        }
      }
    });
    console.log("  ✅ Updated Practice Type options successfully.");
  } catch(err) {
    console.log(`  ❌ Failed to update Practice Types: ${err.message}`);
  }

}

main().catch(err => console.error("Fatal:", err.message));
