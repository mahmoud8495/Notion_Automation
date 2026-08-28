const NOTION_API_KEY = process.env.NOTION_API_KEY;

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const correctAdsbLnaId = "3ca127c0-9076-8084-bce9-ed9394593955";
const rfViaSessionId = "3c9127c0-9076-8067-810d-ea5794f8167a"; // End of Phase 3

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

async function main() {
  console.log("Fixing link for Phase 3 Project...");
  
  try {
    await updatePage(correctAdsbLnaId, {
      "Required Sessions": { relation: [{ id: rfViaSessionId }] }
    });
    console.log("✅ Successfully linked 1090 MHz ADS-B -> Requires RF Via Fencing (End of P3).");
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

main().catch(console.error);
