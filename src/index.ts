import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client, isNotionClientError, APIErrorCode } from "@notionhq/client";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Notion Client ────────────────────────────────────────────────────────────

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
  console.error(
    "NOTION_API_KEY is not set. Provide it via .env or the MCP server env config."
  );
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// ─── Input Schemas (Zod) ──────────────────────────────────────────────────────

const SearchSchema = z.object({
  query: z.string().describe("Search query text"),
  filter_type: z
    .enum(["page", "database"])
    .optional()
    .describe("Optionally restrict results to pages or databases"),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Max results to return (1–100, default 10)"),
});

const ReadPageSchema = z.object({
  page_id: z.string().describe("The Notion page ID (UUID)"),
});

const CreatePageSchema = z.object({
  parent_id: z.string().describe("Parent page or database ID"),
  parent_type: z
    .enum(["page_id", "database_id"])
    .optional()
    .default("page_id")
    .describe("Parent type: 'page_id' (default) or 'database_id'"),
  title: z.string().describe("Title of the new page"),
  content: z
    .string()
    .optional()
    .describe("Optional text paragraph content for the page body"),
});

const UpdatePageSchema = z.object({
  page_id: z.string().describe("The Notion page ID to update"),
  properties: z
    .any()
    .describe(
      "A JSON object of property name → property value payloads (Notion API format)"
    ),
});

const QueryDatabaseSchema = z.object({
  database_id: z.string().describe("The Notion database ID to query"),
  filter: z
    .any()
    .optional()
    .describe("Optional Notion API filter object"),
  sorts: z
    .any()
    .optional()
    .describe("Optional array of sort objects"),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Max results to return (1–100, default 10)"),
});

const AppendBlocksSchema = z.object({
  block_id: z.string().describe("The parent block or page ID to append to"),
  children: z
    .array(z.any())
    .describe("Array of Notion block objects to append"),
});

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "notion_search",
    description:
      "Search the Notion workspace for pages or databases matching a query.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query text" },
        filter_type: {
          type: "string",
          enum: ["page", "database"],
          description: "Optionally restrict results to pages or databases",
        },
        page_size: {
          type: "number",
          description: "Max results (1–100, default 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "notion_read_page",
    description:
      "Retrieve the metadata and top-level block content of a Notion page.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page_id: { type: "string", description: "The Notion page ID (UUID)" },
      },
      required: ["page_id"],
    },
  },
  {
    name: "notion_create_page",
    description:
      "Create a new page under a parent page or database with a title and optional body text.",
    inputSchema: {
      type: "object" as const,
      properties: {
        parent_id: { type: "string", description: "Parent page or database ID" },
        parent_type: {
          type: "string",
          enum: ["page_id", "database_id"],
          description: "Parent type (default: page_id)",
        },
        title: { type: "string", description: "Title of the new page" },
        content: {
          type: "string",
          description: "Optional paragraph text for the page body",
        },
      },
      required: ["parent_id", "title"],
    },
  },
  {
    name: "notion_update_page",
    description:
      "Update properties of an existing Notion page (e.g., title, status, tags).",
    inputSchema: {
      type: "object" as const,
      properties: {
        page_id: { type: "string", description: "The page ID to update" },
        properties: {
          type: "object",
          description:
            "A JSON object of property name → property value payloads (Notion API format)",
        },
      },
      required: ["page_id", "properties"],
    },
  },
  {
    name: "notion_query_database",
    description:
      "Query a Notion database with optional filters and sorts. Returns matching pages.",
    inputSchema: {
      type: "object" as const,
      properties: {
        database_id: {
          type: "string",
          description: "The database ID to query",
        },
        filter: {
          type: "object",
          description: "Optional Notion API filter object",
        },
        sorts: {
          type: "array",
          description: "Optional array of sort objects",
        },
        page_size: {
          type: "number",
          description: "Max results (1–100, default 10)",
        },
      },
      required: ["database_id"],
    },
  },
  {
    name: "notion_append_blocks",
    description:
      "Append child blocks (paragraphs, headings, lists, etc.) to a Notion page or block.",
    inputSchema: {
      type: "object" as const,
      properties: {
        block_id: {
          type: "string",
          description: "The parent block or page ID to append to",
        },
        children: {
          type: "array",
          description: "Array of Notion block objects to append",
        },
      },
      required: ["block_id", "children"],
    },
  },
];

// ─── Tool Handlers ────────────────────────────────────────────────────────────

async function handleSearch(args: unknown) {
  const { query, filter_type, page_size } = SearchSchema.parse(args);

  const searchParams: any = {
    query,
    page_size,
  };

  if (filter_type) {
    searchParams.filter = { property: "object", value: filter_type };
  }

  const response = await notion.search(searchParams);

  // Return a simplified view for readability
  const results = response.results.map((result: any) => ({
    id: result.id,
    object: result.object,
    title:
      result.properties?.title?.title?.[0]?.plain_text ??
      result.properties?.Name?.title?.[0]?.plain_text ??
      result.title?.[0]?.plain_text ??
      "(untitled)",
    url: result.url,
    last_edited_time: result.last_edited_time,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(results, null, 2),
      },
    ],
  };
}

async function handleReadPage(args: unknown) {
  const { page_id } = ReadPageSchema.parse(args);

  const [page, blocks] = await Promise.all([
    notion.pages.retrieve({ page_id }),
    notion.blocks.children.list({ block_id: page_id, page_size: 100 }),
  ]);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { metadata: page, content: blocks.results },
          null,
          2
        ),
      },
    ],
  };
}

async function handleCreatePage(args: unknown) {
  const { parent_id, parent_type, title, content } =
    CreatePageSchema.parse(args);

  const parent =
    parent_type === "database_id"
      ? { database_id: parent_id }
      : { page_id: parent_id };

  const children: any[] = content
    ? [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content } }],
          },
        },
      ]
    : [];

  const response = await notion.pages.create({
    parent: parent as any,
    properties: {
      title: {
        title: [{ text: { content: title } }],
      },
    },
    children,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            id: (response as any).id,
            url: (response as any).url,
            created_time: (response as any).created_time,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleUpdatePage(args: unknown) {
  const { page_id, properties } = UpdatePageSchema.parse(args);

  const response = await notion.pages.update({
    page_id,
    properties: properties as any,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            id: (response as any).id,
            url: (response as any).url,
            last_edited_time: (response as any).last_edited_time,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleQueryDatabase(args: unknown) {
  const { database_id, filter, sorts, page_size } =
    QueryDatabaseSchema.parse(args);

  const queryParams: any = {
    database_id,
    page_size,
  };

  if (filter) queryParams.filter = filter;
  if (sorts) queryParams.sorts = sorts;

  const response = await (notion as any).databases.query(queryParams);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(response.results, null, 2),
      },
    ],
  };
}

async function handleAppendBlocks(args: unknown) {
  const { block_id, children } = AppendBlocksSchema.parse(args);

  const response = await notion.blocks.children.append({
    block_id,
    children: children as any,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            appended: response.results.length,
            block_ids: response.results.map((b: any) => b.id),
          },
          null,
          2
        ),
      },
    ],
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

const TOOL_HANDLERS: Record<string, (args: unknown) => Promise<any>> = {
  notion_search: handleSearch,
  notion_read_page: handleReadPage,
  notion_create_page: handleCreatePage,
  notion_update_page: handleUpdatePage,
  notion_query_database: handleQueryDatabase,
  notion_append_blocks: handleAppendBlocks,
};

// ─── Server Setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: "notion-local-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = TOOL_HANDLERS[name];
  if (!handler) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Unknown tool: "${name}". Available tools: ${Object.keys(TOOL_HANDLERS).join(", ")}`,
        },
      ],
    };
  }

  try {
    return await handler(args);
  } catch (error: unknown) {
    let message: string;

    if (isNotionClientError(error)) {
      // Surface Notion-specific error details (permissions, not found, etc.)
      message = `Notion API error [${error.code}]: ${error.message}`;
    } else if (error instanceof z.ZodError) {
      message = `Invalid input: ${error.issues.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join("; ")}`;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }

    return {
      isError: true,
      content: [{ type: "text" as const, text: `Error: ${message}` }],
    };
  }
});

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notion MCP server is running on stdio transport.");
}

main().catch((err) => {
  console.error("Fatal error starting Notion MCP server:", err);
  process.exit(1);
});
