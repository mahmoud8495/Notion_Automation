// Convert the Prerequisites relation from single_property to dual_property
// This will separate forward links (prereqs) from backlinks (dependents)
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PRACTICE_DB_ID = "252127c0-9076-8246-893f-81596062fa94";

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Step 1: Check current state of the relation
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 1: CHECK CURRENT RELATION TYPE");
  console.log("═══════════════════════════════════════════════\n");

  const dbResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, {
    headers: HEADERS,
  });
  const dbData = await dbResp.json();
  const prereqProp = dbData.properties?.["Prerequisites"];
  
  if (!prereqProp) {
    console.log("❌ Prerequisites property not found!");
    return;
  }

  console.log(`  Current type: ${prereqProp.type}`);
  console.log(`  Relation config: ${JSON.stringify(prereqProp.relation)}`);
  console.log(`  Property ID: ${prereqProp.id}`);

  if (prereqProp.relation?.type === "dual_property") {
    console.log("\n  ✅ Already dual_property — no conversion needed.");
    return;
  }

  // Step 2: Convert to dual_property
  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 2: CONVERT TO DUAL_PROPERTY");
  console.log("═══════════════════════════════════════════════\n");

  // Update the database to change the relation type
  const updateResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({
      properties: {
        "Prerequisites": {
          relation: {
            database_id: PRACTICE_DB_ID,
            type: "dual_property",
            dual_property: {},
          },
        },
      },
    }),
  });

  const updateData = await updateResp.json();
  
  if (updateData.object === "error") {
    console.log(`❌ Error: ${updateData.message}`);
    console.log(`   Code: ${updateData.code}`);
    
    // If we can't convert, we need an alternative approach
    console.log("\n  Alternative: Creating a NEW dual_property relation...");
    
    // Create a new relation called "Prereqs" with dual_property type
    const createResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify({
        properties: {
          "Prereqs": {
            relation: {
              database_id: PRACTICE_DB_ID,
              type: "dual_property",
              dual_property: {},
            },
          },
        },
      }),
    });
    
    const createData = await createResp.json();
    if (createData.object === "error") {
      console.log(`❌ Create also failed: ${createData.message}`);
      return;
    }
    
    // Find the new property
    const newProp = createData.properties?.["Prereqs"];
    console.log(`  ✅ Created new "Prereqs" property`);
    console.log(`  Type: ${newProp?.type}`);
    console.log(`  Relation config: ${JSON.stringify(newProp?.relation)}`);
    
    // Find the synced (reverse) property name
    const syncedId = newProp?.relation?.dual_property?.synced_property_id;
    console.log(`  Synced property ID: ${syncedId}`);
    
    // Look through all properties to find the synced one
    for (const [name, prop] of Object.entries(createData.properties || {})) {
      if (prop.id === syncedId) {
        console.log(`  Reverse column name: "${name}"`);
        break;
      }
    }
    
    console.log("\n  Now need to: migrate data from old Prerequisites to new Prereqs");
    console.log("  And update the Availability formula to reference 'Prereqs'");
    
  } else {
    console.log("  ✅ Successfully converted to dual_property!");
    
    // Check the new state
    const newProp = updateData.properties?.["Prerequisites"];
    console.log(`  New config: ${JSON.stringify(newProp?.relation)}`);
    
    const syncedId = newProp?.relation?.dual_property?.synced_property_id;
    console.log(`  Synced property ID: ${syncedId}`);
    
    for (const [name, prop] of Object.entries(updateData.properties || {})) {
      if (prop.id === syncedId) {
        console.log(`  Reverse column name: "${name}" (can be renamed to "Dependents")`);
        break;
      }
    }
  }

  // Step 3: Verify the new DB schema
  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 3: VERIFY NEW SCHEMA");
  console.log("═══════════════════════════════════════════════\n");

  await sleep(2000);
  
  const verifyResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, {
    headers: HEADERS,
  });
  const verifyData = await verifyResp.json();
  
  console.log("  All properties:");
  for (const [name, prop] of Object.entries(verifyData.properties || {})) {
    let details = "";
    if (prop.type === "relation") details = ` → db: ${prop.relation?.database_id}, type: ${prop.relation?.type}`;
    if (prop.type === "formula") details = ` → formula`;
    if (prop.type === "rollup") details = ` → rollup`;
    console.log(`    "${name}" [${prop.type}]${details}`);
  }
}

main().catch(err => console.error("Fatal:", err.message, err.stack));
