import { Terminal, type ITerminalOptions } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import { Unicode11Addon } from "xterm-addon-unicode11";
import SplitPane from "../split/SplitPane";
import Tab from "../tab";
import createHTMLElement from "../../utils/createElement";

const api = window.api;

const config: ITerminalOptions = {
  cursorBlink: true,
  allowTransparency: true,
  allowProposedApi: true,
  fontFamily: "Consolas",
  fontSize: 14,
  letterSpacing: 0,
  theme: {
    background: "#2E3440",
    foreground: "#F8F8F0",
    cursor: "#0059ae",
    cursorAccent: "#ffffff99",
    selectionBackground: "#1c91f8",
    selectionForeground: "#ffffff",
    black: "#2E3440",
    red: "#c45c66",
    green: "#c3ce5f",
    yellow: "#FD971F",
    blue: "#49a9a4",
    magenta: "#66D9EF",
    cyan: "#38CCD1",
    white: "#ffffff",
    brightBlack: "#65737e",
    brightRed: "#c45c66",
    brightGreen: "#c3ce5f",
    brightYellow: "#FD971F",
    brightBlue: "#49a9a4",
    brightMagenta: "#66D9EF",
    brightCyan: "#38CCD1",
    brightWhite: "#F8F8F0",
  },
};

export class Term {
  id: number;
  shell?: string;
  tab: Tab;
  xterm = new Terminal(config);
  private fitAddon = new FitAddon();
  private webglAddon = new WebglAddon();
  private unicode11Addon = new Unicode11Addon();

  container: HTMLDivElement = createHTMLElement("div", "term-conatiner-fit");
  splitPane?: SplitPane;

  constructor(
    tab: Tab,
    id: number,

    shell?: string, // name (bash.exe) or path
    splitPane?: SplitPane,
  ) {
    this.tab = tab;
    this.id = id;
    this.shell = shell;
    this.splitPane = splitPane;

    this.xterm.loadAddon(this.fitAddon);
    this.xterm.loadAddon(this.unicode11Addon);
    this.loadWebGl();

    this.xterm.unicode.activeVersion = "11";

    this.xterm.onResize((vals) => {
      api.resizePty(id, { ...vals });

      this.fitAddon.fit();
    });

    // @ts-ignore TODO preload/index.d.ts
    api.onResponse(id, (_event, data) => {
      this.xterm.write(data);
    });

    // @ts-ignore TODO preload/index.d.ts
    api.onPtyExit(id, (_event, _data) => {
      this.close();
      this.unmount();
    });

    this.xterm.onData((data) => {
      api?.invoke(id, data);
    });
    this.xterm.open(this.container);
    // No clue why maybe dev issue only?
    // this.resize()
    setTimeout(() => this.resize(), 0);
  }

  loadWebGl() {
    this.webglAddon.onContextLoss(() => {
      this.webglAddon.dispose();
    });
    this.xterm.loadAddon(this.webglAddon);
  }

  appendTo(el: HTMLElement) {
    this.container.remove();
    el.appendChild(this.container);
    // this.resize()
    setTimeout(() => this.resize(), 10);
  }

  resize() {
    const isHeddin = this.tab.container.classList.contains("hidden");
    if (isHeddin) return;
    this.fitAddon.fit();
    api.resizePty(this.id, {
      cols: this.xterm.cols,
      rows: this.xterm.rows,
    });
  }

  unmount() {
    if (this.splitPane) {
      this.splitPane.removeTerm(this.id);
    }
    this.xterm.dispose();
    this.container.remove();
  }

  /** kills the pty and xterm but doesn't remove the object from its tab's array. use "close()" instead */
  async dangerouslyKill() {
    const isKilled = await api?.killPty(this.id);
    if (isKilled) {
      console.log("ola one dead");
    }
  }

  close() {
    if (this.splitPane) {
      this.splitPane.removeTerm(this.id);
    }
    this.tab.killTerm(this.id);
  }

  exit() {
    api.killPty(this.id);
  }
}

export default async function createTerm(
  tab: Tab,
  shell?: string,
  splitPane?: SplitPane,
): Promise<Term> {
  const uid = await api.initPtyProcess(shell);

  const term = new Term(tab, uid, shell, splitPane);

  term.xterm.attachCustomKeyEventHandler((e) => {
    if (e.type === "keyup") {
      return false;
    }
    if (e.key === "ArrowRight" && e.ctrlKey && e.shiftKey && !e.altKey) {
      console.log("split right");
      term.xterm.blur();
      splitHandler(term, "right");
      return false;
    }
    if (e.key === "ArrowDown" && e.ctrlKey && e.shiftKey && !e.altKey) {
      console.log("split down");
      term.xterm.blur();
      splitHandler(term, "down");
      return false;
    }
    return true;
  });

  return term;
}

const splitHandler = async (term: Term, splitType: "right" | "down") => {
  let splitPane: SplitPane;

  if (term.splitPane === undefined) {
    if (splitType === "down") {
      splitPane = new SplitPane("VERTICAL", term);
    } else {
      splitPane = new SplitPane("HORIZONTAL", term);
    }
  } else {
    const isParentH = term.splitPane.container.classList.contains(
      "split_pane_horizontal",
    );

    if (isParentH) {
      if (splitType === "right") splitPane = term.splitPane;
      else {
        // down and Horizontal => new split-pane Vertical
        // term.splitPane.dangerouslyRemoveTerm(term.uid)
        splitPane = new SplitPane("VERTICAL", term);
      }
    } else {
      if (splitType === "down") splitPane = term.splitPane;
      else {
        // right and vertical => new parent Horizontal
        // term.splitPane.dangerouslyRemoveTerm(term.uid)
        splitPane = new SplitPane("HORIZONTAL", term);
      }
    }
  }

  const newTerm = await createTerm(term.tab, term.shell, splitPane);
  const index = term.container.parentElement?.dataset.index || undefined;
  if (typeof index === "string") splitPane.addTerm(newTerm, Number(index) + 1);
  else splitPane.addTerm(newTerm);
  newTerm.xterm.focus();
  term.tab.terms.push(newTerm);

  return newTerm;
};
