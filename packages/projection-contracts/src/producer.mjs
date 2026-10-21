// Generated from canonical TypeScript; do not edit.

// implementation/produce.mts
import { canonical as canonical2, fail as fail2, list, request, shape as shape2, sourceKey, sourceRef, unique } from "./contract.mjs";

// implementation/source-items.mts
import { choice, copy, fail, json, refs, shape, text } from "./contract.mjs";
function item(v, source) {
  shape(v, ["id", "semanticRef", "group", "value", "evidence", "provenance", "resolutionRefs", "visibility"]);
  const id = text(v.id), semanticRef = v.semanticRef === null ? null : text(v.semanticRef);
  shape(v.group, ["kind", "ref"]);
  const group = { kind: choice(v.group.kind, ["semantic", "structural", "presentation"]), ref: text(v.group.ref) };
  if (group.kind === "semantic" && group.ref !== semanticRef) fail("InvalidProjection");
  const visibility = choice(v.visibility, ["visible", "redacted", "omitted"]);
  const evidence = refs(v.evidence), provenance = refs(v.provenance), resolutionRefs = refs(v.resolutionRefs);
  if (visibility === "omitted") return null;
  if (visibility === "redacted") return { id, semanticRef: null, group: { kind: "presentation", ref: "redacted" }, value: null, evidence: [], provenance: [], resolutionRefs: [], visibility: "redacted", sourceRefs: [source] };
  return { ...copy({ id, semanticRef, group, value: json(v.value), evidence, provenance, resolutionRefs, visibility }), sourceRefs: [source] };
}
function unresolved(v, source) {
  shape(v, ["id", "reason", "evidence", "contextRefs", "actionRefs"]);
  return { ...copy({ id: text(v.id), reason: text(v.reason), evidence: refs(v.evidence), contextRefs: refs(v.contextRefs), actionRefs: refs(v.actionRefs) }), sourceRefs: [source] };
}
function relation(v, source) {
  shape(v, ["id", "from", "to", "relationRef"]);
  return { ...copy({ id: text(v.id), from: text(v.from), to: text(v.to), relationRef: text(v.relationRef) }), sourceRefs: [source] };
}

// implementation/seal.mts
import { canonical, digest, frozen } from "./contract.mjs";
function seal(kind, key, lineage, data, maximum) {
  const body = { contract: "projection/0.10.0", kind, key, lineage, data };
  const snapshot = { ...body, revision: "pp:" + digest(body) };
  canonical(snapshot, maximum);
  return frozen(snapshot);
}

// implementation/produce.mts
function produce(input, exactSources) {
  const r = request(input), l = r.limits;
  canonical2(exactSources);
  const values = list(exactSources, l.sources);
  if (values.length !== r.sources.length) fail2("SourceUnavailable");
  const sources = /* @__PURE__ */ new Map();
  for (const value of values) {
    shape2(value, ["source", "items", "relations", "unresolved", "truncated"]);
    sourceRef(value.source);
    if (typeof value.truncated !== "boolean") fail2("InvalidProjection");
    const key = sourceKey(value.source);
    if (sources.has(key)) fail2("InvalidSourceRevision");
    sources.set(key, value);
  }
  const items = [], relations = [], unresolvedItems = [];
  let truncated = false, omitted = 0;
  for (const ref of r.sources) {
    const s = sources.get(sourceKey(ref));
    if (!s) fail2("InvalidSourceRevision");
    for (const v of list(s.items, l.items)) {
      const next = item(v, ref);
      if (next) items.push(next);
      else omitted++;
    }
    for (const v of list(s.unresolved, l.unresolved)) unresolvedItems.push(unresolved(v, ref));
    for (const v of list(s.relations, l.relations)) relations.push(relation(v, ref));
    truncated ||= s.truncated === true;
  }
  list(items, l.items);
  list(relations, l.relations);
  list(unresolvedItems, l.unresolved);
  unique([...items, ...unresolvedItems], (v) => v.id);
  unique(relations, (v) => v.id);
  const ids = new Set(items.filter((v) => v.visibility === "visible").map((v) => v.id));
  for (const v of relations) if (!ids.has(v.from) || !ids.has(v.to)) fail2("InvalidProjection");
  if (items.reduce((n, v) => n + v.provenance.length, 0) + unresolvedItems.reduce((n, v) => n + v.evidence.length, 0) > l.provenance) fail2("ProjectionLimitExceeded");
  for (const values2 of [items, relations, unresolvedItems]) values2.sort((a, b) => a.id < b.id ? -1 : 1);
  return seal(
    "Data",
    r.key,
    { sources: r.sources, producer: r.producer, request: r },
    { items, relations, unresolved: unresolvedItems, truncated, omittedByPolicy: omitted },
    l.snapshotBytes
  );
}

// implementation/scene.mts
import { canonical as canonical4, copy as copy4, fail as fail6, limits as limits2, list as list5, refs as refs3, roles, shape as shape6, text as text5, unique as unique5 } from "./contract.mjs";

// implementation/snapshot.mts
import { canonical as canonical3, digest as digest2, fail as fail3, list as list2, record as record2, request as request2, shape as shape3, sourceKey as sourceKey2, sourceRef as sourceRef2, text as text2, unique as unique2 } from "./contract.mjs";
function validateSnapshot(v) {
  canonical3(v, 524288);
  shape3(v, ["contract", "kind", "key", "lineage", "data", "revision"]);
  if (v.contract !== "projection/0.10.0" || v.kind !== "Data" && v.kind !== "Scene") fail3("InvalidProjection");
  const { revision, ...body } = v;
  if (revision !== "pp:" + digest2(body)) fail3("InvalidProjection");
  shape3(v.lineage, ["sources", "producer", "request"], v.kind === "Scene" ? ["dataProjection", "sceneConfiguration"] : []);
  const r = request2(v.lineage.request), l = r.limits;
  text2(v.key);
  canonical3(v, l.snapshotBytes);
  const declared = record2(v.lineage.request);
  if (canonical3(v.lineage.sources) !== canonical3(declared.sources) || canonical3(v.lineage.producer) !== canonical3(declared.producer)) fail3("InvalidProjection");
  const d = v.data;
  shape3(d, ["items", "relations", "unresolved", "truncated", "omittedByPolicy"], v.kind === "Scene" ? ["focus", "purpose", "regions", "actions", "temporal", "presentation"] : []);
  if (typeof d.truncated !== "boolean" || typeof d.omittedByPolicy !== "number" || !Number.isSafeInteger(d.omittedByPolicy) || d.omittedByPolicy < 0 || d.omittedByPolicy > l.sources * l.items) fail3("InvalidProjection");
  const known = new Set(r.sources.map(sourceKey2));
  const checkSource = (x) => {
    const refs4 = list2(x.sourceRefs, 1);
    if (refs4.length !== 1 || !known.has(sourceKey2(refs4[0]))) fail3("InvalidSourceRevision");
    return sourceRef2(refs4[0]);
  };
  const items = list2(d.items, l.items).map((value) => {
    const x = record2(value), source = checkSource(x), { sourceRefs, ...body2 } = x;
    const parsed = item(body2, source);
    if (!parsed || canonical3(parsed) !== canonical3(x)) fail3("InvalidProjection");
    return parsed;
  });
  const unresolvedItems = list2(d.unresolved, l.unresolved).map((value) => {
    const x = record2(value), source = checkSource(x), { sourceRefs, ...body2 } = x;
    return unresolved(body2, source);
  });
  unique2([...items, ...unresolvedItems], (x) => x.id);
  const relations = unique2(list2(d.relations, l.relations).map((value) => {
    const x = record2(value), source = checkSource(x), { sourceRefs, ...body2 } = x;
    return relation(body2, source);
  }), (x) => x.id);
  const ids = new Set(items.filter((x) => x.visibility === "visible").map((x) => x.id));
  for (const x of relations) if (!ids.has(x.from) || !ids.has(x.to)) fail3("InvalidProjection");
  if (items.reduce((n, x) => n + x.provenance.length, 0) + unresolvedItems.reduce((n, x) => n + x.evidence.length, 0) > l.provenance) fail3("ProjectionLimitExceeded");
  const data = { items, relations, unresolved: unresolvedItems, truncated: d.truncated, omittedByPolicy: d.omittedByPolicy };
  if (v.kind === "Data") {
    if (v.key !== r.key) fail3("InvalidProjection");
  } else {
    shape3(v.lineage.dataProjection, ["key", "revision"]);
    const base = seal("Data", r.key, { sources: r.sources, producer: r.producer, request: r }, data, l.snapshotBytes);
    if (base.key !== v.lineage.dataProjection.key || base.revision !== v.lineage.dataProjection.revision) fail3("InvalidProjection");
    const rebuilt = buildScene(base, v.lineage.sceneConfiguration);
    if (canonical3(rebuilt) !== canonical3(v)) fail3("InvalidProjection");
  }
  return v;
}

// implementation/scene-actions.mts
import { validateInputDeclaration } from "@zixcel/interaction/input";
import { copy as copy2, fail as fail4, limits, list as list3, refs as refs2, shape as shape4, sourceKey as sourceKey3, sourceRef as sourceRef3, text as text3, unique as unique3 } from "./contract.mjs";
function actions(value, maximum, data) {
  return unique3(list3(value, maximum).map((v) => {
    shape4(v, ["id", "targetOwner", "commandRef", "contextRefs", "sourceRefs", "label"], ["interaction"]);
    const id = text3(v.id), targetOwner = text3(v.targetOwner), commandRef = text3(v.commandRef), label = text3(v.label, 1024), contextRefs = refs2(v.contextRefs);
    const expected = new Set(data.lineage.sources.map(sourceKey3));
    const sourceRefs = list3(v.sourceRefs, limits(data.lineage.request.limits).sources).map((s) => {
      if (!expected.has(sourceKey3(s))) fail4("InvalidSourceRevision");
      return sourceRef3(s);
    });
    if (!sourceRefs.length) fail4("InvalidSourceRevision");
    let interaction;
    if (v.interaction !== void 0) {
      const i = v.interaction;
      shape4(i, ["ref", "generation", "inputContractRef", "input"]);
      const ref = text3(i.ref), generation = text3(i.generation), inputContractRef = text3(i.inputContractRef);
      if (validateInputDeclaration(i.input).length) fail4("InvalidProjection");
      const input = i.input;
      if (input.action.contract_revision !== inputContractRef || input.action.operation_id !== commandRef) fail4("InvalidProjection");
      interaction = { ref, generation, inputContractRef, input: copy2(input) };
    }
    return copy2({ id, targetOwner, commandRef, label, contextRefs, sourceRefs, ...interaction === void 0 ? {} : { interaction } });
  }), (v) => v.id);
}

// implementation/scene-bindings.mts
import { fail as fail5, list as list4, shape as shape5, text as text4, unique as unique4 } from "./contract.mjs";
function visibleReader(data) {
  return (itemId, valuePath) => {
    text4(itemId);
    const path = list4(valuePath, 16).map((key) => text4(key, 256));
    const item2 = data.data.items.find((item3) => item3.id === itemId && item3.visibility === "visible");
    if (!item2) fail5("InvalidProjection");
    let value = item2.value;
    for (const key of path) {
      if (value === null || typeof value !== "object" || !Object.hasOwn(value, key)) fail5("InvalidProjection");
      const d = Object.getOwnPropertyDescriptor(value, key);
      if (!d || !("value" in d)) fail5("InvalidProjection");
      value = d.value;
    }
    return value;
  };
}
function presentation(value, maximum, visibleValue) {
  if (value === void 0) return void 0;
  return unique4(list4(value, maximum).map((binding) => {
    shape5(binding, ["itemId"], ["titlePath", "title", "summaryPath", "fields", "symbol"]);
    visibleValue(binding.itemId, []);
    if (Object.hasOwn(binding, "title") === Object.hasOwn(binding, "titlePath")) fail5("InvalidProjection");
    const title = text4(Object.hasOwn(binding, "titlePath") ? visibleValue(binding.itemId, binding.titlePath) : binding.title, 1024);
    const fields = binding.fields === void 0 ? void 0 : list4(binding.fields, 16).map((field) => {
      shape5(field, ["label", "valuePath"]);
      const label = text4(field.label, 256);
      const value2 = visibleValue(binding.itemId, field.valuePath);
      if (value2 !== null && typeof value2 !== "string" && typeof value2 !== "boolean" && typeof value2 !== "number") fail5("InvalidProjection");
      if (typeof value2 === "string" && value2.length > 4096) fail5("ProjectionLimitExceeded");
      return { label, value: value2 };
    });
    const symbol = binding.symbol === void 0 ? void 0 : text4(binding.symbol, 64);
    const summary = binding.summaryPath === void 0 ? void 0 : text4(visibleValue(binding.itemId, binding.summaryPath), 2048);
    return { itemId: text4(binding.itemId), title, ...summary === void 0 ? {} : { summary }, ...fields === void 0 ? {} : { fields }, ...symbol === void 0 ? {} : { symbol } };
  }), (item2) => item2.itemId);
}
function temporal(value, maximum, visibleValue) {
  if (value === void 0) return void 0;
  shape5(value, ["label", "items"]);
  const label = text4(value.label, 256);
  const items = unique4(list4(value.items, maximum).map((binding) => {
    shape5(binding, ["itemId", "valuePath", "format"]);
    text4(binding.itemId);
    list4(binding.valuePath, 16).forEach((key) => text4(key, 256));
    if (binding.format !== "utcInstant" && binding.format !== "unixMilliseconds") fail5("InvalidProjection");
    let at = visibleValue(binding.itemId, binding.valuePath);
    if (binding.format === "unixMilliseconds") {
      if (typeof at !== "number" || !Number.isSafeInteger(at) || at < 0 || at > 253402300799999) fail5("InvalidProjection");
      at = new Date(at).toISOString();
    }
    if (typeof at !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(at) || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at) fail5("InvalidProjection");
    return { itemId: text4(binding.itemId), at };
  }), (item2) => item2.itemId).sort((a, b) => a.at === b.at ? a.itemId < b.itemId ? -1 : 1 : a.at < b.at ? -1 : 1);
  return { label, items };
}

// implementation/scene.mts
function scene(data, configuration) {
  return buildScene(data, configuration);
}
function buildScene(value, configuration) {
  const data = validateSnapshot(value);
  if (data.kind !== "Data") fail6("InvalidProjection");
  canonical4(configuration);
  shape6(configuration, ["key", "focus", "purpose", "regions", "actions"], ["temporal", "presentation"]);
  const key = text5(configuration.key), focus = text5(configuration.focus), purpose = text5(configuration.purpose);
  const l = limits2(data.lineage.request.limits), ids = new Set([...data.data.items, ...data.data.unresolved].map((x) => x.id));
  const regions = unique5(list5(configuration.regions, l.regions).map((v) => {
    shape6(v, ["id", "role", "itemIds"]);
    const id = text5(v.id), role = text5(v.role);
    if (!roles.includes(role)) fail6("InvalidProjection");
    const itemIds = unique5(refs3(v.itemIds, l.items));
    if (itemIds.some((id2) => !ids.has(id2))) fail6("InvalidProjection");
    return { id, role, itemIds };
  }), (v) => v.id);
  const actions2 = actions(configuration.actions, l.actions, data), visibleValue = visibleReader(data);
  const presentation2 = presentation(configuration.presentation, l.items, visibleValue), temporal2 = temporal(configuration.temporal, l.items, visibleValue);
  const lineage = { ...copy4(data.lineage), dataProjection: { key: data.key, revision: data.revision }, sceneConfiguration: copy4(configuration) };
  return seal("Scene", key, lineage, { ...copy4(data.data), focus, purpose, regions, actions: actions2, ...temporal2 ? { temporal: temporal2 } : {}, ...presentation2 ? { presentation: presentation2 } : {} }, l.snapshotBytes);
}

// implementation/recovery.mts
import { canonical as canonical5, fail as fail7, frozen as frozen2, copy as copy5, request as request3, shape as shape7, text as text6 } from "./contract.mjs";
function rebuild(input, readExact) {
  const r = request3(input);
  const sources = r.sources.map((ref) => {
    let value;
    try {
      value = readExact(ref);
    } catch {
      fail7("ProjectionRebuildUnavailable");
    }
    if (value && typeof value === "object" && "then" in value) {
      try {
        Promise.prototype.then.call(value, void 0, () => {
        });
      } catch {
      }
      fail7("ProjectionRebuildUnavailable");
    }
    if (value == null) fail7("ProjectionRebuildUnavailable");
    return value;
  });
  return produce(r, sources);
}
function recovery(snapshot, receiverRevision) {
  validateSnapshot(snapshot);
  if (receiverRevision !== null) text6(receiverRevision);
  if (receiverRevision === snapshot.revision) return { kind: "NoChange", revision: snapshot.revision };
  return { kind: "Snapshot", revision: snapshot.revision, payload: Buffer.from(canonical5(snapshot, 524288)) };
}
function adoptSnapshot(snapshot, expected) {
  shape7(expected, ["key", "revision"]);
  text6(expected.key);
  text6(expected.revision);
  validateSnapshot(snapshot);
  if (snapshot.key !== expected.key || snapshot.revision !== expected.revision) fail7("InvalidSourceRevision");
  return frozen2(copy5(snapshot));
}
export {
  adoptSnapshot,
  produce,
  rebuild,
  recovery,
  scene,
  validateSnapshot
};
