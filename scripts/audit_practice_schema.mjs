const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PRACTICE_DB_ID = "252127c0-9076-8246-893f-81596062fa94";

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function main() {
  const dbResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, {
    headers: HEADERS,
  });
  const dbData = await dbResp.json();
  
  console.log("PRACTICE SESSIONS SCHEMA:");
  for (const [name, prop] of Object.entries(dbData.properties || {})) {
    console.log(`- ${name} [${prop.type}]`);
  }
}

main().catch(console.error);
