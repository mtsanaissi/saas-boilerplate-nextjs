import fs from "node:fs/promises";
import path from "node:path";

const TASKS_JSON_PATH = "tasks/tasks.json";
const TASKS_SCHEMA_PATH = "tasks/tasks.schema.json";
const TASKS_MD_PATH = "TASKS.md";

function usage() {
  console.log(
    [
      "Usage:",
      "  node scripts/tasks.mjs check",
      "  node scripts/tasks.mjs write-md",
      "  node scripts/tasks.mjs fmt",
      "",
      `Reads ${TASKS_JSON_PATH} and optionally regenerates ${TASKS_MD_PATH}.`,
    ].join("\n"),
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function jsonPointerGet(root, pointer) {
  if (pointer === "" || pointer === "#") return root;
  if (!pointer.startsWith("#/")) return undefined;

  const parts = pointer
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));

  let current = root;
  for (const part of parts) {
    if (!isPlainObject(current) && !Array.isArray(current)) return undefined;
    current = current[part];
    if (current === undefined) return undefined;
  }
  return current;
}

function validateJsonSchemaSubset(value, schema, schemaRoot, pathStr, errors) {
  if (!schema || typeof schema !== "object") {
    errors.push(`${pathStr} schema is not an object.`);
    return;
  }

  if (typeof schema.$ref === "string") {
    const resolved = jsonPointerGet(schemaRoot, schema.$ref);
    if (!resolved) {
      errors.push(`${pathStr} $ref "${schema.$ref}" could not be resolved.`);
      return;
    }
    validateJsonSchemaSubset(value, resolved, schemaRoot, pathStr, errors);
    return;
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${pathStr} must equal ${JSON.stringify(schema.const)}.`);
    return;
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    errors.push(
      `${pathStr} must be one of ${schema.enum
        .map((v) => JSON.stringify(v))
        .join(", ")}.`,
    );
    return;
  }

  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const matches = allowed.some((t) => {
      if (t === "null") return value === null;
      if (t === "array") return Array.isArray(value);
      if (t === "object") return isPlainObject(value);
      if (t === "integer")
        return typeof value === "number" && Number.isInteger(value);
      return typeof value === t;
    });
    if (!matches) {
      errors.push(`${pathStr} must be of type ${allowed.join("|")}.`);
      return;
    }
  }

  if (typeof value === "string") {
    if (
      typeof schema.minLength === "number" &&
      value.length < schema.minLength
    ) {
      errors.push(`${pathStr} must have minLength ${schema.minLength}.`);
    }
    if (typeof schema.pattern === "string") {
      const re = new RegExp(schema.pattern);
      if (!re.test(value))
        errors.push(`${pathStr} must match pattern ${schema.pattern}.`);
    }
  }

  if (Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i += 1) {
      validateJsonSchemaSubset(
        value[i],
        schema.items,
        schemaRoot,
        `${pathStr}[${i}]`,
        errors,
      );
    }
  }

  if (isPlainObject(value)) {
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!(key in value)) errors.push(`${pathStr}.${key} is required.`);
    }

    const properties = isPlainObject(schema.properties)
      ? schema.properties
      : {};
    for (const [key, propSchema] of Object.entries(properties)) {
      if (!(key in value)) continue;
      validateJsonSchemaSubset(
        value[key],
        propSchema,
        schemaRoot,
        `${pathStr}.${key}`,
        errors,
      );
    }

    if (schema.additionalProperties === false) {
      const allowedKeys = new Set(Object.keys(properties));
      for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key))
          errors.push(`${pathStr}.${key} is not allowed.`);
      }
    }
  }
}

function parseDate(dateStr, { allowNull }) {
  if (dateStr === null)
    return allowNull ? null : { ok: false, reason: "must not be null" };
  if (typeof dateStr !== "string") return { ok: false, reason: "not a string" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
    return { ok: false, reason: "not YYYY-MM-DD" };
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime()))
    return { ok: false, reason: "invalid date" };
  // Ensure round-trips to same YMD (catches 2025-02-31)
  const iso = date.toISOString().slice(0, 10);
  if (iso !== dateStr) return { ok: false, reason: "invalid calendar date" };
  return { ok: true, value: dateStr, date };
}

function statusToMd(status) {
  switch (status) {
    case "pending":
      return "PENDING";
    case "in_progress":
      return "IN_PROGRESS";
    case "blocked":
      return "BLOCKED";
    case "done":
      return "DONE";
    default:
      return "UNKNOWN";
  }
}

function compareTaskIds(a, b) {
  // T-001 -> 1
  const aNum = Number(a.id.slice(2));
  const bNum = Number(b.id.slice(2));
  return aNum - bNum;
}

function statusRank(status) {
  switch (status) {
    case "pending":
      return 0;
    case "in_progress":
      return 1;
    case "blocked":
      return 2;
    case "done":
      return 3;
    default:
      return 99;
  }
}

function compareByCreatedDescThenIdDesc(a, b) {
  const aRank = statusRank(a.status);
  const bRank = statusRank(b.status);
  if (aRank !== bRank) return aRank - bRank;
  if (a.createdAt !== b.createdAt)
    return b.createdAt.localeCompare(a.createdAt);
  // Higher IDs are assumed newer if same date
  return compareTaskIds(b, a);
}

const schemaCache = new Map();
async function readJsonFile(jsonPath) {
  const raw = await fs.readFile(jsonPath, "utf8");
  return JSON.parse(raw);
}

async function loadTasksSchema(schemaRef) {
  const tasksDir = path.dirname(TASKS_JSON_PATH);
  const resolvedPath = schemaRef
    ? path.resolve(tasksDir, schemaRef)
    : path.resolve(TASKS_SCHEMA_PATH);

  const cacheKey = resolvedPath.replaceAll("\\", "/");
  const cached = schemaCache.get(cacheKey);
  if (cached) return cached;

  const schema = await readJsonFile(resolvedPath);
  schemaCache.set(cacheKey, schema);
  return schema;
}

async function validateTasksDoc(doc) {
  const errors = [];

  if (!doc || typeof doc !== "object") {
    errors.push("Root must be an object.");
    return { ok: false, errors };
  }

  const schema = await loadTasksSchema(
    typeof doc.$schema === "string" ? doc.$schema : undefined,
  );
  const schemaErrors = [];
  validateJsonSchemaSubset(doc, schema, schema, "$", schemaErrors);
  if (schemaErrors.length > 0) {
    return { ok: false, errors: schemaErrors };
  }

  const ids = new Set();
  for (let i = 0; i < doc.tasks.length; i += 1) {
    const task = doc.tasks[i];
    const prefix = `tasks[${i}]`;

    if (typeof task.id !== "string" || !/^T-\d{3}$/.test(task.id)) {
      errors.push(`${prefix}.id must match ^T-\\d{3}$ (e.g. T-001).`);
    } else if (ids.has(task.id)) {
      errors.push(`${prefix}.id "${task.id}" is duplicated.`);
    } else {
      ids.add(task.id);
    }

    if (typeof task.title !== "string" || task.title.trim().length === 0) {
      errors.push(`${prefix}.title must be a non-empty string.`);
    }

    if (typeof task.description !== "string") {
      errors.push(`${prefix}.description must be a string (can be empty).`);
    }

    if (!["pending", "in_progress", "blocked", "done"].includes(task.status)) {
      errors.push(
        `${prefix}.status must be one of pending|in_progress|blocked|done.`,
      );
    }

    const created = parseDate(task.createdAt, { allowNull: false });
    if (created && created.ok === false)
      errors.push(`${prefix}.createdAt ${created.reason}.`);

    const completed = parseDate(task.completedAt, { allowNull: true });
    if (completed && completed.ok === false)
      errors.push(`${prefix}.completedAt ${completed.reason}.`);

    if (task.status === "done" && task.completedAt === null) {
      errors.push(`${prefix}.completedAt must be set when status is done.`);
    }
    if (task.status !== "done" && task.completedAt !== null) {
      errors.push(`${prefix}.completedAt must be null unless status is done.`);
    }

    if (
      created &&
      completed &&
      created.ok === true &&
      completed.ok === true &&
      created.date.getTime() > completed.date.getTime()
    ) {
      errors.push(`${prefix} completedAt must be >= createdAt.`);
    }

    if (!Array.isArray(task.acceptanceCriteria)) {
      errors.push(`${prefix}.acceptanceCriteria must be an array.`);
    } else {
      for (let j = 0; j < task.acceptanceCriteria.length; j += 1) {
        const criterion = task.acceptanceCriteria[j];
        const cPrefix = `${prefix}.acceptanceCriteria[${j}]`;
        if (
          typeof criterion.text !== "string" ||
          criterion.text.trim().length === 0
        ) {
          errors.push(`${cPrefix}.text must be a non-empty string.`);
        }
        if (typeof criterion.done !== "boolean") {
          errors.push(`${cPrefix}.done must be a boolean.`);
        }
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

async function readTasksDoc() {
  const doc = await readJsonFile(TASKS_JSON_PATH);
  const result = await validateTasksDoc(doc);
  if (!result.ok) {
    const message = `Invalid ${TASKS_JSON_PATH}:\n- ${result.errors.join("\n- ")}`;
    throw new Error(message);
  }
  return doc;
}

function renderTaskMarkdown(task) {
  const status = statusToMd(task.status);
  return `- ${task.id} - [${status}] - ${task.title}`;
}

function renderTasksMarkdown(doc) {
  const tasksSorted = [...doc.tasks].sort(compareByCreatedDescThenIdDesc);

  const blocks = tasksSorted.map(renderTaskMarkdown);

  return [
    "# Tasks Log",
    "",
    "> Read-only view generated from `tasks/tasks.json` (source of truth).",
    "",
    "Do not hand-edit this file. To edit tasks, update `tasks/tasks.json` and run:",
    "",
    "- `pnpm tasks:md`",
    "",
    "---",
    "",
    ...blocks,
    "",
  ].join("\n");
}

async function writeMd() {
  const doc = await readTasksDoc();
  const md = renderTasksMarkdown(doc);
  await fs.writeFile(TASKS_MD_PATH, md, "utf8");
}

function normalizeTasksDoc(doc) {
  const tasks = [...doc.tasks].sort(compareByCreatedDescThenIdDesc);
  return { ...doc, tasks };
}

async function fmt() {
  const doc = await readJsonFile(TASKS_JSON_PATH);
  const validated = await validateTasksDoc(doc);
  if (!validated.ok) {
    const message = `Invalid ${TASKS_JSON_PATH}:\n- ${validated.errors.join("\n- ")}`;
    throw new Error(message);
  }
  const normalized = normalizeTasksDoc(doc);
  await fs.writeFile(
    TASKS_JSON_PATH,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const command = process.argv[2];
  if (!command) {
    usage();
    process.exitCode = 2;
    return;
  }

  if (command === "check") {
    await readTasksDoc();
    return;
  }

  if (command === "write-md") {
    await writeMd();
    return;
  }

  if (command === "fmt") {
    await fmt();
    return;
  }

  usage();
  process.exitCode = 2;
}

await main();
