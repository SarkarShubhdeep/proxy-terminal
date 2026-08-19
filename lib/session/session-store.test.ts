import { beforeEach, describe, expect, it } from "vitest";

import { useSessionStore } from "./session-store";

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.getState().unmountVfs();
  });

  it("starts unmounted", () => {
    const session = useSessionStore.getState();
    expect(session.isVfsMounted).toBe(false);
    expect(session.vfsFolderId).toBeNull();
  });

  it("records a mounted folder id", () => {
    useSessionStore.getState().mountVfs("folder-123");
    const session = useSessionStore.getState();
    expect(session.isVfsMounted).toBe(true);
    expect(session.vfsFolderId).toBe("folder-123");
  });

  it("clears mount state on unmount", () => {
    useSessionStore.getState().mountVfs("folder-123");
    useSessionStore.getState().unmountVfs();
    const session = useSessionStore.getState();
    expect(session.isVfsMounted).toBe(false);
    expect(session.vfsFolderId).toBeNull();
  });
});
