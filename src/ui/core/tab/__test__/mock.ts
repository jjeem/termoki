import { vi } from "vitest";
import type _Tab from "../index";

let idIndex = 1;

const Tab = vi.fn<[], Partial<_Tab>>((): Partial<_Tab> => {
  return {
    id: idIndex++,
    tabBtn: document.createElement("li"),
    container: document.createElement("div"),
    render: vi.fn(),
    resize: vi.fn(),
    close: vi.fn(),
    hide: vi.fn(),
    initTerm: vi.fn(),
    killTerm: vi.fn(),
  };
});

export default Tab;
