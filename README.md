# Notion Automation & MCP Server

A comprehensive automation suite and Model Context Protocol (MCP) server for Notion. This project transforms a static Notion workspace into a dynamic, self-governing **Skill Mastery OS**.

## Architecture & Features

This repository contains two main components:

### 1. Notion MCP Server (`/src`)
A fully-featured Model Context Protocol (MCP) server written in TypeScript that bridges AI agents with the Notion API. It exposes powerful tools for AI agents to interact with a Notion workspace natively:
- `notion_search`: Search across pages and databases.
- `notion_read_page`: Read blocks and rich text from any page.
- `notion_create_page`: Programmatically create new pages in databases.
- `notion_update_page`: Update database properties dynamically.
- `notion_query_database`: Query databases using complex Notion filters.
- `notion_append_blocks`: Append content to existing pages.

### 2. The Prerequisite Engine (`/scripts`)
A suite of programmatic automation scripts written in Node.js that manipulate Notion database schemas and data to build a complex **Prerequisite Engine**. 

These scripts construct a highly complex, two-way gated state machine:
- **Phase Gating**: Ensures that Phase 2 cannot start until the Phase 1 project is completed.
- **Rollup Cascades**: Uses dual-property relations and rollups to track dependencies.
- **Drag-and-Drop Automations**: Converts checkbox mechanics into drag-and-drop mechanics using Notion Formulas that react to Select properties.

## Setup & Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   NOTION_API_KEY=ntn_your_notion_integration_token_here
   ```

3. **Build the MCP Server**
   ```bash
   npm run build
   ```

4. **Connect to an AI IDE**
   Configure your MCP client (like Cursor, Claude Desktop, or Antigravity) to point to the built server:
   ```json
   {
     "mcpServers": {
       "notion": {
         "command": "node",
         "args": ["/path/to/notion-automation/dist/index.js"],
         "env": {
           "NOTION_API_KEY": "ntn_..."
         }
       }
     }
   }
   ```

## Running the Automation Scripts
The `/scripts` folder contains various `.mjs` scripts used to orchestrate the Notion database schemas. You can run any of them using node:
```bash
node scripts/make_drag_drop.mjs
```

## Tech Stack
- **TypeScript / Node.js**
- **Model Context Protocol SDK** (`@modelcontextprotocol/sdk`)
- **Notion Official API Client** (`@notionhq/client`)
- **Zod** (Schema validation)
