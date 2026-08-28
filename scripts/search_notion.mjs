import { Client } from "@notionhq/client";
const NOTION_API_KEY = process.env.NOTION_API_KEY;

const notion = new Client({ auth: NOTION_API_KEY });

async function main() {
  console.log("Searching Notion for 'Finished Tasks'...");
  const response = await notion.search({
    query: "Finished Tasks",
    sort: {
      direction: "descending",
      timestamp: "last_edited_time"
    }
  });

  if (response.results.length === 0) {
    console.log("No results found for 'Finished Tasks'.");
    return;
  }

  for (const result of response.results) {
    console.log(`\n--- Result ---`);
    console.log(`Type: ${result.object}`);
    console.log(`ID: ${result.id}`);
    
    if (result.object === "database") {
      const title = result.title[0]?.plain_text || "Untitled";
      console.log(`Database Name: ${title}`);
    } else if (result.object === "page") {
      let title = "Untitled";
      if (result.properties) {
        for (const key of Object.keys(result.properties)) {
          if (result.properties[key].type === "title") {
            title = result.properties[key].title[0]?.plain_text || "Untitled";
            break;
          }
        }
      }
      console.log(`Page Title: ${title}`);
      console.log(`Parent: ${JSON.stringify(result.parent)}`);
    }
  }
}

main().catch(console.error);
