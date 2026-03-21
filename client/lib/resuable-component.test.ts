import { describe, expect, it } from "vitest";

import {
  formatLabel,
  formatRuntime,
  getInitials,
  parseList,
} from "./resuable-component";

describe("resuable-component helpers", () => {
  describe("getInitials", () => {
    it("returns U for empty input", () => {
      expect(getInitials("   ")).toBe("U");
    });

    it("returns first letter for single word", () => {
      expect(getInitials("nolan")).toBe("N");
    });

    it("returns first letters for first two words", () => {
      expect(getInitials("Christopher Nolan")).toBe("CN");
    });
  });

  describe("parseList", () => {
    it("parses comma-separated values", () => {
      expect(parseList("Action, Drama, Thriller")).toEqual([
        "Action",
        "Drama",
        "Thriller",
      ]);
    });

    it("returns empty array for undefined", () => {
      expect(parseList(undefined)).toEqual([]);
    });
  });

  describe("formatLabel", () => {
    it("formats snake and kebab case labels", () => {
      expect(formatLabel("pro_actor")).toBe("Pro Actor");
      expect(formatLabel("assistant-director")).toBe("Assistant Director");
    });

    it("normalizes whitespace and casing", () => {
      expect(formatLabel("  eXECUTIVE   PRODUCER  ")).toBe("Executive Producer");
    });
  });

  describe("formatRuntime", () => {
    it("returns N/A for invalid runtime", () => {
      expect(formatRuntime(0)).toBe("N/A");
      expect(formatRuntime(undefined)).toBe("N/A");
    });

    it("formats only minutes when under an hour", () => {
      expect(formatRuntime(59 * 60)).toBe("59m");
    });

    it("formats only hours when exact hour", () => {
      expect(formatRuntime(2 * 60 * 60)).toBe("2h");
    });

    it("formats hours and minutes when mixed", () => {
      expect(formatRuntime(125 * 60)).toBe("2h 5m");
    });
  });
});
