const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PRACTICE_DB_ID = "252127c0-9076-8246-893f-81596062fa94";

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function main() {
  console.log("Adding 'Board Column' formula to Practice Sessions...");
  
  const resp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({
      properties: {
        "Board Column": {
          formula: {
            expression: 'if(prop("Output Produced") == true, "✅ Finished Tasks", prop("Phase"))'
          }
        }
      }
    })
  });
  
  const data = await resp.json();
  if (data.object === "error") {
    console.error(`❌ Error: ${data.message}`);
  } else {
    console.log("✅ Successfully added 'Board Column' formula!");
  }
}

main().catch(console.error);
