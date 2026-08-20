import { beforeEach, describe, expect, it } from "vitest";

import { useOverlayStore } from "./overlay-store";

describe("overlay-store", () => {
  beforeEach(() => {
    useOverlayStore.setState({ filePick: null });
  });

  it("resolves pickFile with the selected file", async () => {
    const pending = useOverlayStore.getState().pickFile(".txt,.md");
    expect(useOverlayStore.getState().filePick?.accept).toBe(".txt,.md");
    const file = new File(["hi"], "notes.txt", { type: "text/plain" });
    useOverlayStore.getState().resolveFilePick(file);
    await expect(pending).resolves.toBe(file);
    expect(useOverlayStore.getState().filePick).toBeNull();
  });

  it("resolves pickFile with null on cancel", async () => {
    const pending = useOverlayStore.getState().pickFile(".txt,.md");
    useOverlayStore.getState().resolveFilePick(null);
    await expect(pending).resolves.toBeNull();
  });

  it("is a no-op when resolving without an open picker", () => {
    useOverlayStore.getState().resolveFilePick(null);
    expect(useOverlayStore.getState().filePick).toBeNull();
  });
});
