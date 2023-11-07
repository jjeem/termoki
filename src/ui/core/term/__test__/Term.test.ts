import { beforeEach, describe, expect, it, vi } from "vitest";
import { Terminal } from "xterm";
import { apiMock } from "../../../../preload/__test__/mock";
import * as TabModuleMock from "../../tab/__test__/mock";

vi.stubGlobal("api", apiMock);

vi.mock("xterm-addon-fit");
vi.mock("xterm-addon-unicode11");
vi.mock("xterm-addon-webgl", () => {
  return {
    WebglAddon: vi.fn(() => {
      return {};
    }),
  };
});
vi.mock("xterm", () => {
  return {
    Terminal: vi.fn<[], Partial<Terminal>>((): Partial<Terminal> => {
      return {
        open: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        attachCustomKeyEventHandler: vi.fn(),
        loadAddon: vi.fn(),
      };
    }),
  };
});

vi.mock("../../tab", () => TabModuleMock);

describe("Term", async () => {
  const TabManager = (await import("../../tab/TabManager")).default;
  const Tab = (await import("../../tab")).default;
  const Term = (await import("../index")).Term;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  vi.spyOn(Term.prototype as any, "loadXtermAddons").mockImplementation(
    vi.fn(() => null),
  );
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  vi.spyOn(Term.prototype as any, "registerHandlers").mockImplementation(
    vi.fn(() => null),
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load addons and register event handlers", () => {
    const manager = new TabManager();
    const tab = new Tab(manager);
    const term = new Term(tab, 1);

    // @ts-ignore private method
    expect(term.loadXtermAddons).toHaveBeenCalledOnce();
    // @ts-ignore private method
    expect(term.registerHandlers).toHaveBeenCalledOnce();
  });

  it("should resize both xterm and pty", () => {
    const manager = new TabManager();
    const tab = new Tab(manager);
    const term = new Term(tab, 1);

    term.resize();
    expect(window.api.resizePty).toHaveBeenCalledOnce();
    // @ts-ignore private
    expect(term.fitAddon.fit).toHaveBeenCalledOnce();
  });

  it("resizes after inserted into the DOM", () => {
    const manager = new TabManager();
    const tab = new Tab(manager);
    const term = new Term(tab, 1);

    vi.spyOn(term, "resize");
    vi.useFakeTimers();

    term.appendTo(tab.container);

    vi.advanceTimersByTime(100);

    expect(term.resize).toBeCalled();
  });
});

describe("createTerm() func", async () => {
  const TabManager = (await import("../../tab/TabManager")).default;
  const Tab = (await import("../../tab")).default;
  const { default: createTerm, Term } = await import("../index");

  vi.spyOn(Term.prototype, "attachCustomKeyEventHandler");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches splitting Event Handlers", async () => {
    const manager = new TabManager();
    const tab = new Tab(manager);
    const term = await createTerm(tab);

    expect(term.attachCustomKeyEventHandler).toBeCalled();
  });
});
