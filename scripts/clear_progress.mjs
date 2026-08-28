const NOTION_API_KEY = process.env.NOTION_API_KEY;

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const SESSIONS = {
  stackup:        "c4d127c0-9076-83f0-8f0d-0117f626a250",
  pdn:            "a8d127c0-9076-828e-8fb6-810a47c57906",
  copperPours:    "3c9127c0-9076-8084-989f-cf03d35c8f4a",
  thermalVias:    "3c9127c0-9076-80cb-891b-e43546aed455",
  hotLoop:        "bfd127c0-9076-820f-b11c-01e6172b8e57",
  refPlanes:      "3c9127c0-9076-8014-accb-dcaa2c70bd37",
  ctrlImpedance:  "3c9127c0-9076-8098-9c37-c821530feff3",
  diffPair:       "3c9127c0-9076-80f1-a87f-c9872eb292ee",
  crosstalk:      "3c9127c0-9076-80fc-893f-e10ffa134597",
  keepOut:        "3c9127c0-9076-808a-965c-cf3405cf5684",
  cpw:            "3c9127c0-9076-80f0-9dee-c398044a6fc7",
  impedanceMatch: "3c9127c0-9076-80fc-8b89-f8342921e70d",
  rfVia:          "3c9127c0-9076-8067-810d-ea5794f8167a",
};

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

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  CLEARING PROGRESS DATA (Fresh Slate)");
  console.log("═══════════════════════════════════════════════\n");

  const keys = Object.keys(SESSIONS);
  for (const key of keys) {
    const id = SESSIONS[key];
    
    // Set numeric properties to null, checkbox to false, and date to null
    const props = {
      "Focus Quality": { number: null },
      "Difficulty Felt": { number: null },
      "Duration": { number: null },
      "Output Produced": { checkbox: false },
      "Session Date": { date: null }
    };

    try {
      await updatePage(id, props);
      console.log(`  🧹 Cleared progress for: ${key}`);
    } catch (err) {
      console.log(`  ❌ Error clearing ${key}: ${err.message}`);
    }
    
    await sleep(350); // Respect rate limits
  }

  console.log("\n  All 13 sessions are now a completely clean slate!");
}

main().catch(console.error);
