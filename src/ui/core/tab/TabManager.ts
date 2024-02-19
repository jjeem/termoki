import createHTMLElement from "../../utils/createElement";
import Tab from "./index";
// @ts-ignore TODO: declare png & svg
import logo from "../../../../media/logo.png";
import { Shell } from "../../types";
import createDropdown from "../../utils/dropdown";
import loadWindowStyle from "../../utils/loadWindowStyle";

const api = window.api;

// TODO: rework when createDropdown is added
const prepareShellSelect = async (
  createTab: (shell?: string) => Tab,
  shellSelectELement: HTMLSelectElement,
) => {
  const selectElement = shellSelectELement;
  const shells: Shell[] = await api.getAvailableShells();
  const options: HTMLOptionElement[] = shells.map((shell) => {
    const option = createHTMLElement("option");
    option.value = shell.path;
    option.label = shell.label;
    return option;
  });

  options.forEach((option) => selectElement.add(option));

  const unSelect = () => {
    selectElement.selectedIndex = -1;
  };
  selectElement.addEventListener("focus", unSelect);

  selectElement.addEventListener("change", () => {
    createTab(selectElement.value);
    // because change event doesn't catch same previous value we need to empty current value
    unSelect();
  });
};

const createUi = async (createTab: (shell?: string) => Tab) => {
  const titleBar = createHTMLElement("div", "title-bar");
  const nav = createHTMLElement("nav", "nav");
  const logoElement = createHTMLElement("img", "title-bar-logo");
  const tabsList = createHTMLElement("ul", "nav-list");
  const newTabBtn = createHTMLElement("button", "new-tab-button");
  const shellSelectELement = createHTMLElement("select", "shell-select");
  const main = createHTMLElement("div", "main");

  newTabBtn.innerText = "+";
  logoElement.src = logo;

  nav.append(tabsList, newTabBtn, shellSelectELement);
  titleBar.append(logoElement);
  document.querySelector("body")?.append(titleBar, nav, main);

  newTabBtn.addEventListener("click", () => {
    createTab();
  });

  logoElement.addEventListener("click", () => {
    createDropdown({
      x: logoElement.getBoundingClientRect().right,
      y: logoElement.getBoundingClientRect().bottom,
      list: [
        {
          label: "new tab",
          command: "Ctrl+t",
          onClick: () => createTab(),
        },
        {
          label: "open settings",
          onClick: api.openSettings,
        },
      ],
    });
  });

  // call async stuff here after embedding the elements
  prepareShellSelect(createTab, shellSelectELement);
  // on macOS, move logo to the right side
  titleBar.style.flexDirection =
    (await api?.platform()) === "darwin" ? "row-reverse" : "row";
};

const renderUi = (createTab: (shell?: string) => Tab) => {
  loadWindowStyle();
  createUi(createTab);
  return createTab();
};

const registerHandlers = (tabManager: TabManager) => {
  api.onSettingsChange((_, settings) => {
    tabManager.tabs.forEach((tab) =>
      tab.updateTermsOptions(settings["terminal.config"]),
    );

    loadWindowStyle();
  });
};

class TabManager {
  tabs: Tab[] = [];
  activeTab?: Tab;

  constructor() {
    this.activeTab = renderUi(this.createTab.bind(this));

    registerHandlers(this);
  }

  createTab(shell?: string) {
    const tab = new Tab(this, shell);
    this.tabs.push(tab);
    tab.tabBtn.addEventListener("click", () => {
      this.activeTab?.hide();
      tab.render();
      this.activeTab = tab;
    });
    // render it
    tab.tabBtn.click();

    return tab;
  }

  /** Removes the tab from the manager but does not close it */
  removeTab(id: number) {
    const tabs = this.tabs;
    const i = this.tabs.findIndex((tab) => tab.id === id);

    if (this.activeTab?.id === id) {
      // switch to previous tab or the next one
      if (tabs[i - 1]) {
        tabs[i - 1].render();
        this.activeTab = tabs[i - 1];
      } else {
        tabs[i + 1]?.render();
        this.activeTab = tabs[i + 1];
      }
    }

    if (!this.activeTab) {
      this.createTab();
    }

    this.tabs = tabs.filter((tab) => tab.id !== id);
  }
}

export default TabManager;
