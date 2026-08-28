// Deep audit v4: use fetch for raw API + dataSources.query for rows
import { Client } from "@notionhq/client";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const notion = new Client({ auth: NOTION_API_KEY });

const DB_IDS = {
  "Core Skills": "74b127c0-9076-831b-aded-81dc2b0c7d2b",
  "Sub-Skills": "a34127c0-9076-8327-91a4-0196140bcdb4",
  "Practice Sessions": "252127c0-9076-8246-893f-81596062fa94",
  "Projects": "00d127c0-9076-825e-a5c7-0187cf287117",
};

// Use raw fetch for database retrieve (SDK seems to strip properties)
async function rawDbRetrieve(dbId) {
  const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
    },
  });
  return resp.json();
}

// Use raw fetch for database query too
async function rawDbQuery(dbId) {
  const rows = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    rows.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return rows;
}

function extractVal(prop) {
  if (!prop) return "";
  switch (prop.type) {
    case "title": return prop.title?.map(t => t.plain_text).join("") || "";
    case "rich_text": return prop.rich_text?.map(t => t.plain_text).join("") || "";
    case "select": return prop.select?.name || "";
    case "multi_select": return prop.multi_select?.map(s => s.name).join(", ") || "";
    case "checkbox": return String(prop.checkbox);
    case "number": return prop.number !== null ? String(prop.number) : "";
    case "formula": return prop.formula?.string || String(prop.formula?.number ?? "") || JSON.stringify(prop.formula);
    case "rollup": return JSON.stringify(prop.rollup);
    case "relation": return prop.relation?.map(r => r.id).join(", ") || "(none)";
    case "status": return prop.status?.name || "";
    case "date": return prop.date?.start || "";
    case "url": return prop.url || "";
    default: return `(${prop.type})`;
  }
}

try {
  for (const [name, dbId] of Object.entries(DB_IDS)) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📊 DATABASE: ${name} (${dbId})`);
    console.log("=".repeat(70));
    
    // Schema via raw API
    const db = await rawDbRetrieve(dbId);
    console.log("\n--- SCHEMA ---");
    if (db.properties && typeof db.properties === "object") {
      for (const [pName, prop] of Object.entries(db.properties)) {
        let details = "";
        if (prop.type === "select" && prop.select?.options) details = ` options: [${prop.select.options.map(o => `"${o.name}"(${o.color})`).join(", ")}]`;
        if (prop.type === "multi_select" && prop.multi_select?.options) details = ` options: [${prop.multi_select.options.map(o => `"${o.name}"(${o.color})`).join(", ")}]`;
        if (prop.type === "relation") details = ` → db: ${prop.relation?.database_id}, type: ${prop.relation?.type}`;
        if (prop.type === "rollup") details = ` → fn: ${prop.rollup?.function}, relation: ${prop.rollup?.relation_property_name}, target: ${prop.rollup?.rollup_property_name}`;
        if (prop.type === "formula") details = ` → expr: "${prop.formula?.expression || "(hidden)"}"`;
        if (prop.type === "status" && prop.status?.options) details = ` options: [${prop.status.options.map(o => `"${o.name}"(${o.color})`).join(", ")}]`;
        console.log(`  "${pName}" [${prop.type}] (id: ${prop.id})${details}`);
      }
    } else {
      console.log("  (no properties)");
    }

    // Rows via raw API
    const rows = await rawDbQuery(dbId);
    console.log(`\n--- ROWS (${rows.length}) ---`);
    for (const row of rows) {
      let title = "";
      const propVals = {};
      for (const [pName, prop] of Object.entries(row.properties || {})) {
        const val = extractVal(prop);
        if (prop.type === "title") title = val;
        else propVals[pName] = val;
      }
      console.log(`\n  📄 "${title}" (id: ${row.id})`);
      for (const [k, v] of Object.entries(propVals)) {
        if (v && v !== "(none)" && v !== "false") {
          console.log(`     "${k}": ${v}`);
        }
      }
    }
  }
} catch (err) {
  console.error("Error:", err.message);
  console.error(err.stack);
}
