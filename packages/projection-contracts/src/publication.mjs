// Generated from canonical TypeScript; do not edit.

// implementation/publication.mts
import { randomUUID } from "node:crypto";
import { copy, fail, frozen, request, shape, text } from "./contract.mjs";
import { rebuild, validateSnapshot } from "./producer.mjs";
var ProjectionSlot = class {
  #key;
  #fence = randomUUID();
  #snapshot = null;
  #receipt = null;
  constructor(key) {
    this.#key = text(key);
  }
  begin() {
    return frozen({ key: this.#key, expected: this.#fence });
  }
  publish(ticket, snapshot) {
    shape(ticket, ["key", "expected"]);
    validateSnapshot(snapshot);
    if (ticket.key !== this.#key || snapshot.key !== this.#key) fail("InvalidProjection");
    if (this.#receipt?.expected === ticket.expected && this.#receipt.revision === snapshot.revision) {
      if (!this.#snapshot) this.#snapshot = frozen(copy(snapshot));
      return this.#receipt;
    }
    if (ticket.expected !== this.#fence) fail("StaleProjectionPublication");
    this.#snapshot = frozen(copy(snapshot));
    this.#fence = randomUUID();
    this.#receipt = frozen({ key: this.#key, expected: ticket.expected, publication: this.#fence, revision: snapshot.revision });
    return this.#receipt;
  }
  read() {
    if (!this.#snapshot) return null;
    try {
      return frozen(copy(validateSnapshot(this.#snapshot)));
    } catch {
      fail("ProjectionUnavailable");
    }
  }
  dropCache() {
    this.#snapshot = null;
  }
};
function pendingRepair(ticket, input, code) {
  shape(ticket, ["key", "expected"]);
  text(ticket.key);
  text(ticket.expected);
  if (!["ProjectionUnavailable", "ProjectionLimitExceeded"].includes(code)) fail("InvalidProjection");
  const r = request(input);
  if (r.key !== ticket.key) fail("InvalidProjection");
  return frozen({ ticket: copy(ticket), request: r, failure: code });
}
function repair(slot, pending, readExact) {
  shape(pending, ["ticket", "request", "failure"]);
  const p = pendingRepair(pending.ticket, pending.request, pending.failure);
  return slot.publish(p.ticket, rebuild(p.request, readExact));
}
export {
  ProjectionSlot,
  pendingRepair,
  repair
};
