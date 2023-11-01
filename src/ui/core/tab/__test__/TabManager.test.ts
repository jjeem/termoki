import { beforeEach, describe, expect, it, vi } from "vitest";
import * as TabModuleMock from "./mock";
import { apiMock } from "../../../../preload/__test__/mock";

vi.mock("../index.ts", () => TabModuleMock);
vi.stubGlobal("api", apiMock);

describe("TabManager class", async () => {
  const TabManager = (await import("../TabManager")).default;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Create TabManager instance", async () => {
    const tabManager = new TabManager();

    vi.spyOn(tabManager, "createTab");
    vi.spyOn(tabManager, "removeTab");

    expect(tabManager.tabs).toHaveLength(1);
    expect(tabManager.activeTab).toBeTruthy();

    tabManager.createTab();

    expect(tabManager.tabs).toHaveLength(2);
  });

  it("closing last tab should create new one", async () => {
    const tabManager = new TabManager();

    vi.spyOn(tabManager, "createTab");
    vi.spyOn(tabManager, "removeTab");

    const tab1 = tabManager.tabs[0];

    tabManager.removeTab(tabManager.tabs[0].id);

    expect(tabManager.createTab).toBeCalledTimes(1);
    expect(tabManager.removeTab).toBeCalledTimes(1);
    expect(tabManager.removeTab).toBeCalledWith(tab1.id);
    expect(tabManager.activeTab).toBeTruthy();
    expect(tabManager.tabs).toHaveLength(1);
  });

  it("close active tab should activated the one on its left", () => {
    const tabManager = new TabManager();

    vi.spyOn(tabManager, "createTab");
    vi.spyOn(tabManager, "removeTab");

    const tab2 = tabManager.createTab();
    const tab3 = tabManager.createTab();

    expect(tabManager.tabs).toHaveLength(3);

    expect(tabManager.activeTab).toBe(tab3);

    tabManager.removeTab(tab3.id);
    expect(tabManager.tabs).toHaveLength(2);
    expect(tabManager.activeTab).toBe(tab2);

    tabManager.removeTab(tab2.id);
    expect(tabManager.tabs).toHaveLength(1);
    expect(tabManager.activeTab).toBeTruthy();
  });
});
