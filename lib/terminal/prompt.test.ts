import { describe, expect, it } from "vitest";

import { buildPrompt, resolvePromptState, usernameFromEmail } from "./prompt";

describe("resolvePromptState", () => {
  it("returns guest when unauthenticated", () => {
    expect(
      resolvePromptState({ isAuthenticated: false }, { isVfsMounted: false }),
    ).toBe("guest");
  });

  it("returns authenticated when logged in but not mounted", () => {
    expect(
      resolvePromptState({ isAuthenticated: true }, { isVfsMounted: false }),
    ).toBe("authenticated");
  });

  it("returns mounted when logged in and VFS is mounted", () => {
    expect(
      resolvePromptState({ isAuthenticated: true }, { isVfsMounted: true }),
    ).toBe("mounted");
  });
});

describe("buildPrompt", () => {
  it("builds a guest prompt", () => {
    expect(buildPrompt("guest")).toContain("guest@proxy");
  });

  it("builds an authenticated prompt with home path", () => {
    const prompt = buildPrompt("authenticated", "alice");
    expect(prompt).toContain("alice@proxy");
    expect(prompt).toContain("~");
  });

  it("builds a mounted prompt with the VFS folder", () => {
    const prompt = buildPrompt("mounted", "alice", "WebTerminal");
    expect(prompt).toContain("alice@proxy");
    expect(prompt).toContain("~/WebTerminal");
  });
});

describe("usernameFromEmail", () => {
  it("extracts the local part of an email", () => {
    expect(usernameFromEmail("alice@example.com")).toBe("alice");
  });

  it("falls back to user when email is missing", () => {
    expect(usernameFromEmail(undefined)).toBe("user");
  });
});
