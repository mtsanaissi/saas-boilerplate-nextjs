import fs from "node:fs/promises";

const TASKS_JSON_PATH = "tasks/tasks.json";
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

function validateTasksDoc(doc) {
  const errors = [];

  if (!doc || typeof doc !== "object") {
    errors.push("Root must be an object.");
    return { ok: false, errors };
  }

  if (doc.version !== 1) errors.push('Root "version" must be 1.');
  if (!Array.isArray(doc.tasks)) errors.push('Root "tasks" must be an array.');
  if (!Array.isArray(doc.tasks)) return { ok: false, errors };

  const ids = new Set();
  for (let i = 0; i < doc.tasks.length; i += 1) {
    const task = doc.tasks[i];
    const prefix = `tasks[${i}]`;

    if (!task || typeof task !== "object") {
      errors.push(`${prefix} must be an object.`);
      continue;
    }

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
        if (!criterion || typeof criterion !== "object") {
          errors.push(`${cPrefix} must be an object.`);
          continue;
        }
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
  const raw = await fs.readFile(TASKS_JSON_PATH, "utf8");
  const doc = JSON.parse(raw);
  const result = validateTasksDoc(doc);
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
  const raw = await fs.readFile(TASKS_JSON_PATH, "utf8");
  const doc = JSON.parse(raw);
  const validated = validateTasksDoc(doc);
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
