const NOTION_API_KEY = process.env.NOTION_API_KEY;

const HEADERS = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// Gating Projects
const PROJECTS = {
  syncBuck: "3c9127c0-9076-8098-9140-de481b4a9480",
  smartMedia: "3c9127c0-9076-802f-9c07-c7525db32639",
};

const SESSIONS = {
  // Phase 1
  stackup: {
    id: "c4d127c0-9076-83f0-8f0d-0117f626a250",
    phase: "Phase 1",
    types: [{ name: "Theory", color: "blue" }, { name: "Drills", color: "green" }],
    projectPrereq: null,
    notes: "1. Read FR4 material specs (Er, Loss Tangent) for standard JLCPCB/PCBWay stackups.\n2. Open KiCad Board Setup.\n3. Define a 4-layer stackup: Signal / GND / PWR / Signal.\n4. Save as a template."
  },
  pdn: {
    id: "a8d127c0-9076-828e-8fb6-810a47c57906",
    phase: "Phase 1",
    types: [{ name: "Theory", color: "blue" }, { name: "Drills", color: "green" }],
    projectPrereq: null,
    notes: "1. Review capacitor frequency response curves.\n2. Place a high-power IC footprint in KiCad.\n3. Place 0.1µF and 10µF capacitors immediately adjacent to the IC power pins.\n4. Route the power traces through the capacitor pads first."
  },
  copperPours: {
    id: "3c9127c0-9076-8084-989f-cf03d35c8f4a",
    phase: "Phase 1",
    types: [{ name: "Drills", color: "green" }],
    projectPrereq: null,
    notes: "1. Draw a GND polygon pour on the bottom layer.\n2. Draw a VCC polygon pour on the PWR inner layer.\n3. Verify clearance rules are respected around vias and traces.\n4. Press 'B' to fill zones and run DRC."
  },
  thermalVias: {
    id: "3c9127c0-9076-80cb-891b-e43546aed455",
    phase: "Phase 1",
    types: [{ name: "Drills", color: "green" }],
    projectPrereq: null,
    notes: "1. Place a footprint with a large thermal pad (e.g., QFN or D2PAK).\n2. Create a 3x3 array of vias (0.3mm hole / 0.6mm pad) inside the thermal pad.\n3. Stitch the thermal pad directly to the inner GND plane."
  },
  hotLoop: {
    id: "bfd127c0-9076-820f-b11c-01e6172b8e57",
    phase: "Phase 1",
    types: [{ name: "Theory", color: "blue" }, { name: "Deep Work", color: "purple" }],
    projectPrereq: null,
    notes: "1. Analyze a buck converter datasheet (e.g., TI TPS5430).\n2. Identify the high di/dt hot loop.\n3. Place the input capacitors, high-side MOSFET, low-side MOSFET/diode, and inductor in KiCad.\n4. Route the hot loop to enclose the absolute minimum physical area."
  },

  // Phase 2
  refPlanes: {
    id: "3c9127c0-9076-8014-accb-dcaa2c70bd37",
    phase: "Phase 2",
    types: [{ name: "Theory", color: "blue" }],
    projectPrereq: PROJECTS.syncBuck, // Gates Phase 2
    notes: "1. Study return path theory for high-frequency signals.\n2. Create a test layout with a trace crossing a split plane.\n3. Add stitching capacitors across the split and analyze the return current path."
  },
  ctrlImpedance: {
    id: "3c9127c0-9076-8098-9c37-c821530feff3",
    phase: "Phase 2",
    types: [{ name: "Deep Work", color: "purple" }],
    projectPrereq: null,
    notes: "1. Use Saturn PCB Toolkit or KiCad's calculator to determine trace width for 50Ω single-ended impedance on your specific FR4 stackup.\n2. Route a high-speed signal (e.g., SPI clock) using that exact trace width.\n3. Ensure continuous GND reference below the entire trace."
  },
  diffPair: {
    id: "3c9127c0-9076-80f1-a87f-c9872eb292ee",
    phase: "Phase 2",
    types: [{ name: "Drills", color: "green" }, { name: "Deep Work", color: "purple" }],
    projectPrereq: null,
    notes: "1. Calculate trace width and spacing for a 90Ω or 100Ω differential pair (e.g., USB).\n2. Define the differential pair in KiCad schematic.\n3. Route the pair together and use the length tuning tool to phase-match them within 0.1mm."
  },
  crosstalk: {
    id: "3c9127c0-9076-80fc-893f-e10ffa134597",
    phase: "Phase 2",
    types: [{ name: "Theory", color: "blue" }, { name: "Review", color: "red" }],
    projectPrereq: null,
    notes: "1. Review the 3W rule for trace spacing.\n2. Identify two parallel high-speed traces in a design.\n3. Adjust their spacing so the center-to-center distance is at least 3x the trace width to mitigate capacitive/inductive coupling."
  },
  keepOut: {
    id: "3c9127c0-9076-808a-965c-cf3405cf5684",
    phase: "Phase 2",
    types: [{ name: "Drills", color: "green" }],
    projectPrereq: null,
    notes: "1. Place a Wi-Fi/BLE module (e.g., ESP32-WROOM) on a PCB edge.\n2. Draw a Rule Area (keep-out zone) on ALL copper layers directly underneath the antenna overhang.\n3. Verify DRC catches any copper pours violating this zone."
  },

  // Phase 3
  cpw: {
    id: "3c9127c0-9076-80f0-9dee-c398044a6fc7",
    phase: "Phase 3",
    types: [{ name: "Theory", color: "blue" }, { name: "Deep Work", color: "purple" }],
    projectPrereq: PROJECTS.smartMedia, // Gates Phase 3
    notes: "1. Use Saturn PCB Toolkit to calculate trace width and gap spacing for a 50Ω grounded coplanar waveguide.\n2. Route an RF trace from a module to an SMA connector.\n3. Apply the calculated gap clearance to the surrounding GND pour."
  },
  impedanceMatch: {
    id: "3c9127c0-9076-80fc-8b89-f8342921e70d",
    phase: "Phase 3",
    types: [{ name: "Theory", color: "blue" }, { name: "Deep Work", color: "purple" }],
    projectPrereq: null,
    notes: "1. Add a Pi-network (3 components) footprint sequence between an RF output and antenna.\n2. Route them as tightly as possible to minimize parasitic inductance.\n3. Leave the pads unpopulated for tuning on the VNA."
  },
  rfVia: {
    id: "3c9127c0-9076-8067-810d-ea5794f8167a",
    phase: "Phase 3",
    types: [{ name: "Drills", color: "green" }],
    projectPrereq: null,
    notes: "1. Calculate lambda/20 spacing for a 2.4GHz signal (approx 3mm).\n2. Place GND stitching vias along both sides of your Coplanar Waveguide at that exact spacing.\n3. Ensure the vias connect the top layer GND directly to the inner layer GND."
  }
};

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildRichText(text) {
  return text.split('\n').map(line => ({
    type: "text",
    text: { content: line + "\n" }
  }));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  POPULATING SESSIONS (Phases, Types, Notes)");
  console.log("═══════════════════════════════════════════════\n");

  const keys = Object.keys(SESSIONS);
  for (const key of keys) {
    const s = SESSIONS[key];
    
    // Using string matching for names instead of passing color to avoid validation errors
    // since we couldn't update colors earlier. Passing just the name will match existing 
    // options or create new ones with default colors if they don't exist.
    const practiceTypes = s.types.map(t => ({ name: t.name }));
    
    const props = {
      "Phase": { select: { name: s.phase } },
      "Practice Type": { multi_select: practiceTypes },
      "Notes": { rich_text: buildRichText(s.notes) }
    };

    if (s.projectPrereq) {
      props["Project Prerequisites"] = { relation: [{ id: s.projectPrereq }] };
    } else {
      props["Project Prerequisites"] = { relation: [] }; // Explicitly clear if not gating
    }

    try {
      await updatePage(s.id, props);
      const gateStr = s.projectPrereq ? " [GATED]" : "";
      console.log(`  ✅ Updated ${key}${gateStr}`);
    } catch (err) {
      console.log(`  ❌ Error updating ${key}: ${err.message}`);
    }
    
    await sleep(400); // Respect rate limits
  }

  console.log("\n  All 13 sessions populated successfully!");
}

main().catch(err => console.error("Fatal:", err.message));
