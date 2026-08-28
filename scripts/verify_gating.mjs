const NOTION_API_KEY = process.env.NOTION_API_KEY;

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const PRACTICE_DB_ID = "252127c0-9076-8246-893f-81596062fa94";

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  VERIFYING GATING & PHASES");
  console.log("═══════════════════════════════════════════════\n");

  const verifyResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}/query`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ page_size: 100 }),
  });
  const verifyData = await verifyResp.json();

  console.log("  Phase │ Avail        │ Session                           │ Project Gate (Done/Total)");
  console.log("  ──────┼──────────────┼───────────────────────────────────┼──────────────────────────");

  const sessions = verifyData.results.map(row => {
    const title = row.properties?.Name?.title?.[0]?.plain_text || "(untitled)";
    const phase = row.properties?.Phase?.select?.name || "None ";
    const avail = row.properties?.Availability?.formula?.string || "?";
    const projectRollup = row.properties?.["Project Prereq Done"]?.rollup?.number ?? 0;
    const projectLinks = row.properties?.["Project Prerequisites"]?.relation?.length || 0;
    
    // Calculate if project is gating
    let gateStr = "-";
    if (projectLinks > 0) {
      gateStr = `${projectRollup}/${projectLinks} (Requires Project)`;
    }

    return { title, phase, avail, gateStr };
  });

  // Sort by phase then roughly by name (in lieu of the dependency graph sorting for this simple output)
  sessions.sort((a, b) => a.phase.localeCompare(b.phase) || a.title.localeCompare(b.title));

  for (const s of sessions) {
    console.log(`  ${s.phase.padEnd(5)} │ ${s.avail.padEnd(12)} │ ${s.title.padEnd(33)} │ ${s.gateStr}`);
  }
}

main().catch(err => console.error("Fatal:", err.message));
