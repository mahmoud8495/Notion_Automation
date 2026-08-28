const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PROJECTS_DB_ID = "00d127c0-9076-825e-a5c7-0187cf287117";

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function main() {
  const dbResp = await fetch(`https://api.notion.com/v1/databases/${PROJECTS_DB_ID}`, {
    headers: HEADERS,
  });
  const dbData = await dbResp.json();
  
  console.log("PROJECTS DB SCHEMA:");
  for (const [name, prop] of Object.entries(dbData.properties || {})) {
    console.log(`- ${name} [${prop.type}]`);
  }
}

main().catch(console.error);
