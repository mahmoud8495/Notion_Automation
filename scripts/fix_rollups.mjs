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

async function main() {
  console.log("Fixing Formula and Rollups...");
  
  try {
    await updateDatabase(PRACTICE_DB_ID, {
      "Output Produced": {
        formula: {
          expression: 'prop("Phase") == "✅ Finished Tasks" or prop("Phase") == "Finished"'
        }
      }
    });
    console.log("✅ Updated Output Produced formula to include 'Finished'.");
  } catch(e) {
    console.log("❌ Formula update failed:", e.message);
  }
  
  try {
    await updateDatabase(PRACTICE_DB_ID, {
      "Prerequisite Done": {
        rollup: {
          relation_property_name: "Prerequisites",
          rollup_property_name: "Output Produced",
          function: "checked"
        }
      }
    });
    console.log("✅ Updated Prerequisite Done rollup.");
  } catch(e) {
    console.log("❌ Prereq rollup update failed:", e.message);
  }
  
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
    console.log("✅ Updated Required Sessions Done rollup.");
  } catch(e) {
    console.log("❌ Project rollup update failed:", e.message);
  }
}

main().catch(console.error);
