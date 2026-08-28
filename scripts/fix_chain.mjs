// Final fix: re-clear and re-set the chain now that the relation is dual_property,
// rename the reverse column to "Dependents", then verify everything.
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PRACTICE_DB_ID = "252127c0-9076-8246-893f-81596062fa94";

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

const SUB_SKILLS = {
  generalPCB:   "3c9127c0-9076-80c1-949a-caed00394e4b",
  mixedSignal:  "3c9127c0-9076-803b-a14c-f7723f9d0c87",
  rfHighFreq:   "3c9127c0-9076-8043-a3a4-e6be4b8ebd66",
};

const ALL_IDS = Object.values(SESSIONS);

async function updatePage(pageId, properties) {
  const resp = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ properties }),
  });
  const data = await resp.json();
  if (data.object === "error") throw new Error(`${data.message} (page: ${pageId})`);
  return data;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // ═════════════════════════════════════════════
  // STEP 1: Rename reverse column
  // ═════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 1: RENAME REVERSE COLUMN → 'Dependents'");
  console.log("═══════════════════════════════════════════════\n");

  const renameResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({
      properties: {
        "Related to Practice Sessions (Prerequisites)": {
          name: "Dependents",
        },
      },
    }),
  });
  const renameData = await renameResp.json();
  if (renameData.object === "error") {
    console.log(`  ⚠️  Rename failed: ${renameData.message}`);
  } else {
    console.log("  ✅ Renamed to 'Dependents'");
  }

  // ═════════════════════════════════════════════
  // STEP 2: Clear ALL prerequisite relations
  // ═════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 2: CLEAR ALL PREREQUISITES");
  console.log("═══════════════════════════════════════════════\n");

  for (const id of ALL_IDS) {
    await updatePage(id, {
      "Prerequisites": { relation: [] },
      "Prereq New": { relation: [] },
    });
    console.log(`  🧹 Cleared: ${id.substring(0, 8)}...`);
    await sleep(350);
  }

  console.log("\n  ⏳ Waiting 2s...\n");
  await sleep(2000);

  // ═════════════════════════════════════════════
  // STEP 3: Set correct chain + sub-skills
  // ═════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 3: SET CORRECT PREREQUISITES + SUB-SKILLS");
  console.log("═══════════════════════════════════════════════\n");

  const CHAIN = [
    // Phase 1: General PCB Layout
    { id: SESSIONS.stackup,        prereqs: [],                          subSkill: SUB_SKILLS.generalPCB,  name: "Stackup Strategy" },
    { id: SESSIONS.pdn,            prereqs: [SESSIONS.stackup],          subSkill: SUB_SKILLS.generalPCB,  name: "PDN & Decoupling" },
    { id: SESSIONS.copperPours,    prereqs: [SESSIONS.pdn],              subSkill: SUB_SKILLS.generalPCB,  name: "Copper Polygon Pours" },
    { id: SESSIONS.thermalVias,    prereqs: [SESSIONS.copperPours],      subSkill: SUB_SKILLS.generalPCB,  name: "Thermal Vias" },
    { id: SESSIONS.hotLoop,        prereqs: [SESSIONS.thermalVias],      subSkill: SUB_SKILLS.generalPCB,  name: "Hot Loop Minimization" },
    // Phase 2: Mixed-Signal
    { id: SESSIONS.refPlanes,      prereqs: [SESSIONS.hotLoop],          subSkill: SUB_SKILLS.mixedSignal, name: "Continuous Reference Planes" },
    { id: SESSIONS.ctrlImpedance,  prereqs: [SESSIONS.refPlanes],        subSkill: SUB_SKILLS.mixedSignal, name: "Controlled Impedance" },
    { id: SESSIONS.diffPair,       prereqs: [SESSIONS.ctrlImpedance],    subSkill: SUB_SKILLS.mixedSignal, name: "Differential Pair Tuning" },
    { id: SESSIONS.crosstalk,      prereqs: [SESSIONS.diffPair],         subSkill: SUB_SKILLS.mixedSignal, name: "Crosstalk Mitigation (3W)" },
    { id: SESSIONS.keepOut,        prereqs: [SESSIONS.crosstalk],        subSkill: SUB_SKILLS.mixedSignal, name: "Antenna Keep-Out Zones" },
    // Phase 3: RF & High-Freq
    { id: SESSIONS.cpw,            prereqs: [SESSIONS.keepOut],          subSkill: SUB_SKILLS.rfHighFreq,  name: "Coplanar Waveguides (CPW)" },
    { id: SESSIONS.impedanceMatch, prereqs: [SESSIONS.cpw],              subSkill: SUB_SKILLS.rfHighFreq,  name: "Impedance Matching (Pi/T)" },
    { id: SESSIONS.rfVia,          prereqs: [SESSIONS.impedanceMatch],   subSkill: SUB_SKILLS.rfHighFreq,  name: "RF Via Fencing" },
  ];

  for (const item of CHAIN) {
    const props = {
      "Prerequisites": { relation: item.prereqs.map(id => ({ id })) },
      "Sub-Skills": { relation: [{ id: item.subSkill }] },
    };

    await updatePage(item.id, props);
    const prereqLabel = item.prereqs.length === 0 ? "(root)" : CHAIN.find(c => c.id === item.prereqs[0])?.name || "?";
    const phase = item.subSkill === SUB_SKILLS.generalPCB ? "P1" : item.subSkill === SUB_SKILLS.mixedSignal ? "P2" : "P3";
    console.log(`  ✅ [${phase}] ${item.name} ← ${prereqLabel}`);
    await sleep(350);
  }

  console.log("\n  ⏳ Waiting 3s for propagation...\n");
  await sleep(3000);

  // ═════════════════════════════════════════════
  // STEP 4: FINAL VERIFICATION
  // ═════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 4: FINAL VERIFICATION");
  console.log("═══════════════════════════════════════════════\n");

  const verifyResp = await fetch(`https://api.notion.com/v1/databases/${PRACTICE_DB_ID}/query`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ page_size: 100 }),
  });
  const verifyData = await verifyResp.json();

  const nameById = {};
  const dataById = {};
  for (const row of verifyData.results) {
    const title = row.properties?.Name?.title?.[0]?.plain_text || "(untitled)";
    const prereqs = row.properties?.Prerequisites?.relation?.map(r => r.id) || [];
    const avail = row.properties?.Availability?.formula?.string || "?";
    const subSkills = row.properties?.["Sub-Skills"]?.relation?.map(r => r.id) || [];
    nameById[row.id] = title;
    dataById[row.id] = { prereqs, avail, subSkills };
  }

  let allCorrect = true;
  console.log("  #  │ Avail        │ Session                           │ Prereq");
  console.log("  ───┼──────────────┼───────────────────────────────────┼──────────────────────────────");

  for (let i = 0; i < CHAIN.length; i++) {
    const item = CHAIN[i];
    const actual = dataById[item.id];
    if (!actual) {
      console.log(`  ${String(i+1).padStart(2)} │ ❌ NOT FOUND │ ${item.name}`);
      allCorrect = false;
      continue;
    }

    const prereqCorrect = JSON.stringify(actual.prereqs.sort()) === JSON.stringify(item.prereqs.sort());
    const subCorrect = actual.subSkills[0] === item.subSkill;
    const availCorrect = item.prereqs.length === 0 ? actual.avail.includes("Available") : true; // root should be Available

    const status = prereqCorrect && subCorrect ? "✅" : "❌";
    if (!prereqCorrect || !subCorrect) allCorrect = false;
    if (item.prereqs.length === 0 && !actual.avail.includes("Available")) allCorrect = false;

    const prereqName = actual.prereqs.length === 0 ? "(none)" : actual.prereqs.map(id => nameById[id] || id.substring(0,8)).join(", ");
    
    console.log(`  ${String(i+1).padStart(2)} │ ${actual.avail.padEnd(12)} │ ${status} ${item.name.padEnd(32)} │ ${prereqName}`);
  }

  console.log("\n" + "─".repeat(90));
  if (allCorrect) {
    console.log("\n  🎉 ALL 13 SESSIONS VERIFIED — CHAIN IS CORRECT!");
  } else {
    console.log("\n  ⚠️  Some issues remain.");
  }
}

main().catch(err => console.error("Fatal:", err.message, err.stack));
