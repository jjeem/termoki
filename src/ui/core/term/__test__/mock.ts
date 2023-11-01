import { vi } from "vitest";
import type { Term as _Term } from "../index";
import TabMock from "../../tab/__test__/mock";
import type Tab from "../../tab";

let idIndex = 1;

const Term = vi.fn<[], Partial<_Term>>((): Partial<_Term> => {
  return {
    id: idIndex++,
    container: document.createElement("div"),
    tab: new TabMock() as unknown as Tab,
    appendTo: vi.fn(),
    resize: vi.fn(),
    close: vi.fn(),
    exit: vi.fn(),
    unmount: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
  };
});

const createTerm = vi.fn(() => new Term() as _Term);

export default createTerm;
