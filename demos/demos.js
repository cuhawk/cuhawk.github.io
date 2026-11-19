"use strict";

const byId = (id) => document.getElementById(id);

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function onChange(ids, render) {
  for (const id of ids) byId(id).addEventListener("change", render);
  render();
}

function renderGraph(container, nodes, inspect) {
  const buttons = nodes.map(({ name, edge, state }) => {
    const item = element("li");
    const button = element("button", name);
    button.type = "button";
    button.dataset.state = state;
    item.append(element("span", edge, "edge"), button);
    return { item, button };
  });

  function select(index) {
    buttons.forEach(({ button }, position) => {
      button.setAttribute("aria-pressed", String(index === position));
    });
    inspect(nodes[index]);
  }

  buttons.forEach(({ button }, index) => button.addEventListener("click", () => select(index)));
  container.replaceChildren(...buttons.map(({ item }) => item));
  select(0);
}

function renderTrace() {
  const redact = byId("redaction").checked;
  const promise = byId("fixture").value === "promise";
  const callback = promise ? "onReady()" : "onTimer()";
  const asyncEdge = promise ? "async · microtask" : "async · timer task";
  const reported = redact ? "Redacted" : "Private";
  const steps = [
    { name: "start()", edge: "Entry", state: "Private",
      code: "const value = readDraft();", note: "The draft begins with a private field." },
    { name: callback, edge: "→ " + asyncEdge, state: "Private",
      code: promise ? "ready.then(() => onReady(value));" : "setTimeout(() => onTimer(value), 0);",
      note: "The closure carries the draft across the async boundary." },
    { name: "prepare()", edge: "→ synchronous call", state: reported,
      code: redact ? "const event = { type: value.type };" : "const event = value;",
      note: redact ? "Only the public event type is copied." : "The event retains the private field." },
    { name: "previewReport()", edge: "→ synchronous call", state: reported,
      code: "previewReport(event);",
      note: redact ? "The report preview receives only public data." : "The report preview receives private data." },
  ];
  function inspect(step) {
    const snippet = element("p");
    snippet.append(element("code", step.code));
    byId("trace").replaceChildren(
      element("strong", step.name + " · " + step.state), snippet,
      element("p", step.note + " Report input is " + reported.toLowerCase() + "."),
    );
  }
  renderGraph(byId("callgraph"), steps, inspect);
}

function wilson(passed, count) {
  const rate = passed / count;
  const z = 1.959963984540054;
  const zSquared = z ** 2;
  const divisor = 1 + zSquared / count;
  const midpoint = (rate + zSquared / (2 * count)) / divisor;
  const margin = z * Math.sqrt((rate * (1 - rate) + zSquared / (4 * count)) / count) / divisor;
  return [Math.max(0, midpoint - margin), Math.min(1, midpoint + margin)];
}

const percentage = (value) => (value * 100).toFixed(1) + "%";

function intervalCard(name, passed, count) {
  const [low, high] = wilson(passed, count);
  const rate = passed / count;
  const card = element("div", undefined, "metric");
  const track = element("div", undefined, "track");
  const band = element("span", undefined, "band");
  const point = element("span", undefined, "point");
  band.style.left = percentage(low);
  band.style.width = percentage(high - low);
  point.style.left = percentage(rate);
  track.append(band, point);
  const scale = element("div", undefined, "scale");
  scale.append(element("span", "0%"), element("span", "100%"));
  track.setAttribute("aria-hidden", "true");
  scale.setAttribute("aria-hidden", "true");
  card.append(
    element("strong", name),
    element("p", `${passed}/${count} pass · ${percentage(rate)}`),
    track, scale,
    element("p", `95% CI ${percentage(low)}–${percentage(high)}`),
  );
  return card;
}

function renderDashboard() {
  const category = byId("category").value;
  const selected = scenarioOutcomes.filter((row) => !category || category === row[1]);
  const rows = byId("failures").checked
    ? selected.filter((row) => row.slice(2).includes("fail"))
    : selected;
  byId("intervals").replaceChildren(...["Guarded", "Weak"].map((name, index) =>
    intervalCard(name, selected.filter((row) => row[index + 2] === "pass").length, selected.length),
  ));

  byId("scenario-summary").textContent = `Scenario outcomes · ${rows.length} of ${selected.length}`;
  const resultRows = rows.map(([id, , guarded, weak]) => {
    const row = element("tr");
    const title = element("th", id);
    title.scope = "row";
    row.append(title, ...[guarded, weak].map((status) =>
      element("td", status === "pass" ? "Pass" : "Fail", status === "pass" ? "pass" : "fail"),
    ));
    return row;
  });
  if (!resultRows.length) {
    const row = element("tr");
    const cell = element("td", "The selected category has no failures.");
    cell.colSpan = 3;
    row.append(cell);
    resultRows.push(row);
  }
  byId("scenarios").replaceChildren(...resultRows);
}

function renderAccess() {
  const trust = byId("trust").checked;
  const binding = byId("binding").checked;
  // Parents precede children so reachability propagates through the trust boundary.
  const nodes = [
    { name: "Workload identity", edge: "Starting identity", open: true,
      note: "The fictional application identity is the starting point for this review." },
    { name: "Cloud role", edge: "→ federation from workload", parent: 0, open: !trust,
      note: trust ? "The restricted trust policy excludes this identity." : "The trust policy includes this identity." },
    { name: "Namespace group", edge: "→ identity mapping from cloud role", parent: 1, open: true,
      note: "The cloud role maps to a single cluster namespace group." },
    { name: "Read role", edge: "↳ binding from namespace group", parent: 2, open: true, permission: "read",
      note: "The group has read access within the namespace." },
    { name: "Write role", edge: "↳ binding from namespace group", parent: 2, open: !binding, permission: "write",
      note: binding ? "The write-role binding was removed." : "The group has write access within the namespace." },
  ];
  const reachable = [];
  nodes.forEach((node) => {
    const state = node.open && (node.parent === undefined || reachable[node.parent]);
    reachable.push(state);
    node.state = state ? "reachable" : "blocked";
  });
  const permissions = nodes.filter((node) => node.permission && node.state === "reachable")
    .map((node) => node.permission).join(", ");
  renderGraph(byId("access-graph"), nodes, (node) => {
    byId("access-detail").replaceChildren(
      element("strong", `Reachable namespace permissions: ${permissions || "none"}`),
      element("p", `${node.name} · ${node.state}. ${node.note}`),
    );
  });
}

// Costs are represented as integer thousandths of a dollar.
const models = [
  { name: "Cedar", capabilities: ["text"], latency: 120, cost: 2, quality: 72 },
  { name: "Lumen", capabilities: ["text", "vision"], latency: 180, cost: 4, quality: 84 },
  { name: "Prism", capabilities: ["text", "vision"], latency: 180, cost: 6, quality: 92 },
  { name: "Summit", capabilities: ["text"], latency: 420, cost: 8, quality: 97 },
];

function renderRoute() {
  const workload = byId("workload").value;
  const priority = byId("priority").value;
  const budget = Number(byId("budget").value);
  const direction = priority === "quality" ? -1 : 1;
  const ranked = [...models].sort((a, b) =>
    direction * (a[priority] - b[priority]) || a.name.localeCompare(b.name, "en"),
  );

  const decisions = ranked.map((model) => {
    if (!model.capabilities.includes(workload)) return "Unsupported workload";
    if (model.cost > budget) return "Over cost ceiling";
    if (byId("outage-" + model.name).checked) return "Unavailable";
    return "Eligible";
  });
  const selected = decisions.indexOf("Eligible");
  const fallbackCount = decisions.slice(0, selected < 0 ? undefined : selected)
    .filter((decision) => decision === "Unavailable").length;
  let decision = "No route available";
  if (selected >= 0) {
    decisions[selected] = "Selected";
    decision = (fallbackCount ? "Fallback to " : "Routed to ") + ranked[selected].name;
  }

  byId("route-result").replaceChildren(
    element("strong", decision),
    element("p", `Unavailable eligible models skipped: ${fallbackCount}`),
  );
  byId("models").replaceChildren(...ranked.map((model, index) => {
    const row = element("tr");
    const title = element("th", model.name);
    title.scope = "row";
    row.append(title, ...[
      model.latency + " ms", "$" + (model.cost / 1000).toFixed(3), model.quality, decisions[index],
    ].map((value) => element("td", value)));
    return row;
  }));
}

const categories = [...new Set(scenarioOutcomes.map((row) => row[1]))];
for (const category of categories) {
  byId("category").add(new Option(category.replaceAll("_", " "), category));
}
byId("arl-source").href += "/blob/" + arlRevision + "/suites/full.yaml";

for (const { name } of models) {
  const label = element("label", undefined, "check");
  const input = element("input");
  input.type = "checkbox";
  input.id = "outage-" + name;
  label.append(input, name);
  byId("outages").append(label);
}

onChange(["fixture", "redaction"], renderTrace);
onChange(["category", "failures"], renderDashboard);
onChange(["trust", "binding"], renderAccess);
onChange(["workload", "priority", "budget", ...models.map(({ name }) => "outage-" + name)], renderRoute);
