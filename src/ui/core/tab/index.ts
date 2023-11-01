import TabManager from "./TabManager";
import createTerm, { Term } from "../term";
import createHTMLElement from "../../utils/createElement";

class Tab {
  static idPointer = 1;
  id = Tab.idPointer++;
  manager: TabManager;
  tabBtn = createHTMLElement("li", "tab-button");
  container = createHTMLElement("div", "tab");
  terms: Term[] = [];
  private title = "New Tab";
  private closeBtn = createHTMLElement("button", "close-tab-button");

  constructor(tabManager: TabManager, shell?: string) {
    this.manager = tabManager;
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
    document.querySelector(".main")?.appendChild(this.container);

    this.initTerm(this.container, shell).then((term) => {
      term.resize();
      term.focus();
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
    setTimeout(() => this.terms[0]?.focus(), 0);
  }

  resize() {
    this.terms.forEach((term) => term.resize());
  }

  private onClose() {
    this.manager.removeTab(this.id);
  }

  close() {
    this.terms.forEach((term) => term.exit());
    this.container.remove();
    this.tabBtn.remove();
    this.onClose();
  }

  killTerm(id: number) {
    const term = this.terms.find((term) => term.id === id);
    this.terms = this.terms.filter((term) => term.id !== id);
    term?.exit();
    if (this.terms.length === 0) this.close();
  }
}

export default Tab;
