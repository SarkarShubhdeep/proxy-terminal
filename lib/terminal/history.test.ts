import { describe, expect, it } from "vitest";

import { createCommandHistory } from "./history";

describe("createCommandHistory", () => {
  it("pushes commands and navigates upward", () => {
    const history = createCommandHistory();
    history.push("ls");
    history.push("pwd");
    expect(history.navigate("up")).toBe("pwd");
    expect(history.navigate("up")).toBe("ls");
    expect(history.navigate("up")).toBe("ls");
  });

  it("navigates downward to an empty draft", () => {
    const history = createCommandHistory();
    history.push("ls");
    history.navigate("up");
    expect(history.navigate("down")).toBe("");
  });

  it("dedupes consecutive identical commands", () => {
    const history = createCommandHistory();
    history.push("ls");
    history.push("ls");
    expect(history.navigate("up")).toBe("ls");
    expect(history.navigate("up")).toBe("ls");
  });

  it("ignores blank submissions", () => {
    const history = createCommandHistory();
    history.push("   ");
    expect(history.navigate("up")).toBe("");
  });

  it("resetDraft returns navigation to the newest slot", () => {
    const history = createCommandHistory();
    history.push("ls");
    history.navigate("up");
    history.resetDraft();
    expect(history.navigate("down")).toBe("");
  });
});
