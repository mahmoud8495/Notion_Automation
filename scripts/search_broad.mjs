import { Client } from "@notionhq/client";
const NOTION_API_KEY = process.env.NOTION_API_KEY;

const notion = new Client({ auth: NOTION_API_KEY });

async function main() {
  console.log("Searching Notion for 'Finished Tasks' (case insensitive)...");
  const response = await notion.search({
    sort: {
      direction: "descending",
      timestamp: "last_edited_time"
    }
  });

  for (const result of response.results) {
    let title = "Untitled";
    if (result.object === "database") {
      title = result.title[0]?.plain_text || "Untitled";
    } else if (result.object === "page") {
      if (result.properties) {
        for (const key of Object.keys(result.properties)) {
          if (result.properties[key].type === "title") {
            title = result.properties[key].title[0]?.plain_text || "Untitled";
            break;
          }
        }
      }
    }
    
    if (title.toLowerCase().includes("finish") || title.toLowerCase().includes("task")) {
      console.log(`\n--- Match ---`);
      console.log(`Type: ${result.object}`);
      console.log(`ID: ${result.id}`);
      console.log(`Title: ${title}`);
    }
  }
}

main().catch(console.error);
