const NOTION_API_KEY = process.env.NOTION_API_KEY;
const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
};

const stackupId = "c4d127c0-9076-83f0-8f0d-0117f626a250";
const pdnId = "a8d127c0-9076-828e-8fb6-810a47c57906";

async function getPage(id) {
  const resp = await fetch(`https://api.notion.com/v1/pages/${id}`, { headers: HEADERS });
  return await resp.json();
}

async function main() {
  const stackup = await getPage(stackupId);
  const pdn = await getPage(pdnId);

  console.log("STACKUP STRATEGY STATE:");
  console.log(`- Phase: ${stackup.properties["Phase"]?.select?.name}`);
  console.log(`- Output Produced: ${JSON.stringify(stackup.properties["Output Produced"])}`);

  console.log("\nPDN & DECOUPLING STATE:");
  console.log(`- Prerequisite Done Rollup: ${JSON.stringify(pdn.properties["Prerequisite Done"])}`);
  console.log(`- Availability: ${JSON.stringify(pdn.properties["Availability"])}`);
  console.log(`- Prerequisites Relation: ${JSON.stringify(pdn.properties["Prerequisites"])}`);
}

main().catch(console.error);
