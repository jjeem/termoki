import { Terminal, type ITerminalOptions } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import { Unicode11Addon } from "xterm-addon-unicode11";
import SplitPane from "../split/SplitPane";
import Tab from "../tab";
import createHTMLElement from "../../utils/createElement";

const api = window.api;

const defaultConfig: ITerminalOptions = {
  cursorBlink: true,
  allowTransparency: true,
  allowProposedApi: true,
  fontFamily: "Consolas, Menlo, Courier New, monospace",
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
  xterm = new Terminal(defaultConfig);
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

    this.registerHandlers(id);

    this.xterm.open(this.container);
    setTimeout(() => this.resize(), 10);
  }

  private registerHandlers(id: number) {
    api.onResponse(id, (_event, data) => {
      this.xterm.write(data);
    });

    api.onPtyExit(id, (_event, _data) => {
      this.close();
      this.unmount();
    });

    this.xterm.onResize((vals) => {
      api.resizePty(id, { ...vals });
      this.fitAddon.fit();
    });

    this.xterm.onData((data) => {
      api.invoke(id, data);
    });
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
    setTimeout(() => this.resize(), 10);
  }

  resize() {
    const isHidden = this.tab.container.classList.contains("hidden");
    if (isHidden) return;
    this.fitAddon.fit();
    api.resizePty(this.id, {
      cols: this.xterm.cols,
      rows: this.xterm.rows,
    });
  }

  unmount() {
    this.webglAddon.dispose();
    this.xterm.dispose();
    this.container.remove();
  }

  close() {
    if (this.splitPane) {
      this.splitPane.removeTerm(this.id);
    }
    this.tab.killTerm(this.id);
  }

  /** sends api call to close the pty, onExit listener will handle unmounting  */
  exit() {
    api.killPty(this.id);
  }
}

const handleSplit = async (term: Term, splitType: "right" | "down") => {
  let splitPane: SplitPane;

  if (!term.splitPane) {
    splitPane =
      splitType === "right"
        ? new SplitPane("HORIZONTAL", term)
        : new SplitPane("VERTICAL", term);
  } else {
    const isParentHorizontal = term.splitPane.type === "HORIZONTAL";

    if (isParentHorizontal) {
      // Horizontal and right => same parent pane. Otherwise new vertical one
      splitPane =
        splitType === "right"
          ? term.splitPane
          : new SplitPane("VERTICAL", term);
    } else {
      // Vertival and down => same parent pane. Otherwise new horizontal one
      splitPane =
        splitType === "down"
          ? term.splitPane
          : new SplitPane("HORIZONTAL", term);
    }
  }

  const newTerm = await createTerm(term.tab, term.shell, splitPane);
  // we want the new term next to it so increase index by 1
  // undefined will push it to the last
  const index =
    Number(term.container.parentElement?.dataset.index) + 1 || undefined;

  splitPane.addTerm(newTerm, index);
  newTerm.xterm.focus();
  term.tab.terms.push(newTerm);

  return newTerm;
};

async function createTerm(
  tab: Tab,
  shell?: string,
  splitPane?: SplitPane,
): Promise<Term> {
  const id = await api.initPtyProcess(shell);
  const term = new Term(tab, id, shell, splitPane);

  // TODO: abstract
  term.xterm.attachCustomKeyEventHandler((e) => {
    if (e.type === "keyup") {
      // event is fired on both "keyup" and "keydown" events, so we exit in one of them
      return false;
    }
    if (e.key === "ArrowRight" && e.ctrlKey && e.shiftKey && !e.altKey) {
      console.log("split right");
      term.xterm.blur();
      handleSplit(term, "right");
      return false;
    }
    if (e.key === "ArrowDown" && e.ctrlKey && e.shiftKey && !e.altKey) {
      console.log("split down");
      term.xterm.blur();
      handleSplit(term, "down");
      return false;
    }
    return true;
  });

  return term;
}

export default createTerm;
