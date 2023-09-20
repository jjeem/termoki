import { v4 as uuidv4 } from "uuid";
import createTerm, { Term } from "../term";
import createHTMLElement from "../../utils/createElement";

export default class Tab {
  id = uuidv4();
  title = "New Tab";
  tabBtn: HTMLElement = createHTMLElement("li", "tab-button");
  container: HTMLElement = createHTMLElement("div", "tab");
  closeBtn: HTMLButtonElement = createHTMLElement("button", "close-tab-button");
  terms: Term[] = [];

  constructor(onClose: (t: Tab) => void, shell?: string) {
    this.onClose = onClose;
    const tabBtn = this.tabBtn;
    const closeBtn = this.closeBtn;
    closeBtn.innerText = "x";
    tabBtn.innerHTML = `<span>${this.title}</span>`;
    tabBtn.appendChild(closeBtn);
    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      this.close();
    });
    document.querySelector(".nav-list")?.appendChild(tabBtn);
    // tabBtn.addEventListener('click', () => this.render());

    // term
    document.querySelector(".main")?.appendChild(this.container);

    this.initTerm(this.container, shell).then((term) => {
      term.resize();
      term.xterm.focus();
    });
  }

  async initTerm(parent: HTMLElement, shell?: string) {
    // const term = await createTerm(this, parent, shell)
    const term = await createTerm(this, shell);
    term.appendTo(parent);
    this.terms.push(term);
    setTimeout(() => term.resize(), 0);
    return term;
  }

  hide() {
    this.container.classList.add("hidden");
    this.tabBtn.classList.remove("active-tab");
  }

  render() {
    this.container.classList.remove("hidden");
    this.tabBtn.classList.add("active-tab");
    this.resize();
    setTimeout(() => this.terms[0]?.xterm.focus(), 0);
  }

  resize() {
    this.terms.forEach((term) => term.resize());
  }

  // e.x. used to remove the tab from tabs array
  onClose: (t: Tab) => void;

  close() {
    this.terms.forEach((term) => term.exit());
    this.container.remove();
    this.tabBtn.remove();
    this.onClose(this);
  }

  killTerm(id: number) {
    const term = this.terms.find((term) => term.id === id);
    this.terms = this.terms.filter((term) => term.id !== id);
    term?.exit();
    if (this.terms.length === 0) this.close();
  }
}
