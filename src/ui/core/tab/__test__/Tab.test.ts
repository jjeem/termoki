import { describe, expect, it, vi } from "vitest";
import * as TermModuleMock from "../../term/__test__/mock";
import type Tab from "../index";
import { apiMock } from "../../../../preload/__test__/mock";

vi.stubGlobal("api", apiMock);

vi.mock("../../term/index.ts", () => TermModuleMock);

describe("Tab class", async () => {
  const Tab = (await import("../index")).default;
  const TabManager = (
    await vi.importMock<typeof import("../TabManager")>("../TabManager")
  ).default;

  it("Create new Tab instance and close its only terminal", async () => {
    const tabManager = new TabManager();

    // method initTerm is asynchronous and its called inside the constructor
    // so wrap it inside promise and wait for it to resolve to ensure the initTerm
    // has resolved
    const tab = await new Promise<Tab>((resolve) =>
      resolve(new Tab(tabManager)),
    );

    vi.spyOn(tab, "render");
    vi.spyOn(tab, "close");

    expect(tab).toBeInstanceOf(Tab);
    expect(tab.terms).toHaveLength(1);
    expect(tab.tabBtn).toBeDefined();

    tab.killTerm(tab.terms[0].id);

    expect(tab.terms).toHaveLength(0);
    expect(tab.close).toHaveBeenCalledOnce();
  });

  it("calling resize() method resize all terminals", async () => {
    const tabManager = new TabManager();
    const tab = await new Promise<Tab>((res) => res(new Tab(tabManager)));

    tab.initTerm(tab.container);
    tab.initTerm(tab.container);

    tab.resize();

    tab.terms.forEach((term) => {
      expect(term.resize).toBeCalledTimes(1);
    });
  });
});
