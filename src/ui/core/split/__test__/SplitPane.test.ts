import { beforeEach, describe, expect, it, vi } from "vitest";
import SplitPane from "../SplitPane";
import * as TermModuleMock from "../../term/__test__/mock";

vi.mock("../../term/index", () => TermModuleMock);

describe("SplitPane", async () => {
  const createTerm = (
    await vi.importMock<typeof import("../../term/__test__/mock")>("../../term")
  ).default;

  // here because some of them are called inside the constructor and to avoid repeating ts-ignore
  vi.spyOn(SplitPane.prototype, "addTerm");
  vi.spyOn(SplitPane.prototype, "createWrapper");
  // @ts-ignore private
  vi.spyOn(SplitPane.prototype, "dispose");
  // @ts-ignore private
  vi.spyOn(SplitPane.prototype, "shouldDisposeSelf");
  // @ts-ignore private
  vi.spyOn(SplitPane.prototype, "appendLastTermToParent");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has container with correct class", () => {
    const term = createTerm();
    const spH = new SplitPane("HORIZONTAL", term);

    expect(spH.container.classList.item(1)).eq("split_pane_horizontal");

    const spV = new SplitPane("VERTICAL", term);

    expect(spV.container.classList.item(1)).eq("split_pane_vertical");
  });

  it("wraps child terminal with wrapper", () => {
    const term = new createTerm();
    const sp = new SplitPane("HORIZONTAL", term);

    expect(sp.addTerm).toHaveBeenCalledWith(term);
    // @ts-ignore private
    expect(sp.createWrapper).toHaveReturnedWith(sp.childWrappers[0]);
    // @ts-ignore private
    expect(term.appendTo).toHaveBeenCalledWith(sp.childWrappers[0]);
  });

  it("adds the new term in the correct position", () => {
    const term1 = createTerm();
    const term2 = createTerm();
    const term3 = createTerm();
    const sp = new SplitPane("HORIZONTAL", term1);

    // @ts-ignore private
    const wrapper1 = sp.childWrappers[0];

    sp.addTerm(term2, 0);
    // skip one index for resizer
    expect(sp.container.children.item(2)).toBe(wrapper1);
    // 2 terms + 1 resizer
    expect(sp.container.children.length).toBe(3);

    // wrappers are sorted in the same order that they are rendered
    // @ts-ignore private
    const wrapper2 = sp.childWrappers[0];

    sp.addTerm(term3, 1);

    expect(sp.container.children.item(0)).toBe(wrapper2);
    expect(sp.container.children.item(4)).toBe(wrapper1);
    // 3 terms + 2 resizers
    expect(sp.container.children.length).toBe(5);
  });

  it("dispose itself when there's one child left", () => {
    const term1 = createTerm();
    const term2 = createTerm();
    const sp = new SplitPane("HORIZONTAL", term1);
    vi.spyOn(sp, "removeTerm");

    sp.addTerm(term2);
    sp.removeTerm(term1.id);
    // @ts-ignore private
    expect(sp.terms).toHaveLength(1);
    expect(sp.removeTerm).toHaveBeenCalledOnce();
    // @ts-ignore private
    expect(sp.shouldDisposeSelf).toHaveBeenCalledOnce();
    // @ts-ignore private
    expect(sp.dispose).toHaveBeenCalledOnce();
    // @ts-ignore private
    expect(sp.appendLastTermToParent).toHaveBeenCalledWith(term2);
  });

  it("when disposed, move child-pane's children to parent-pane if same type", () => {
    const terms = new Array(5).fill(null).map(() => createTerm());
    const sp1 = new SplitPane("HORIZONTAL", terms[0]);
    const sp2 = new SplitPane("VERTICAL", terms[1]);
    const sp3 = new SplitPane("HORIZONTAL", terms[2]);
    const sp4 = new SplitPane("VERTICAL", terms[3]);
    sp1.addChildPane(sp2);
    sp2.addChildPane(sp3);
    sp3.addChildPane(sp4);
    sp3.addTerm(terms[4]);

    vi.spyOn(sp1, "addChildPane");

    vi.clearAllMocks();
    // this make it call dispose()
    sp2.removeTerm(terms[1].id);

    expect(sp1.addTerm).toBeCalledTimes(2);
    expect(sp1.addChildPane).toBeCalledTimes(1);
    // @ts-ignore private
    expect(sp1.terms).toHaveLength(3);
    // @ts-ignore private
    expect(sp1.childWrappers).toHaveLength(4);
    // @ts-ignore private
    expect(sp1.childPanes).toHaveLength(1);
  });
});
