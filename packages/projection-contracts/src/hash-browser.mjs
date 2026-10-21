// Generated from canonical TypeScript; do not edit.

// implementation/hash-browser.mts
import { digest } from "ohash/crypto";
var sha256 = (value) => Array.from(
  atob(digest(value).replaceAll("-", "+").replaceAll("_", "/") + "="),
  (c) => c.charCodeAt(0).toString(16).padStart(2, "0")
).join("");
export {
  sha256
};
