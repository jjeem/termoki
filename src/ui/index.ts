import Tab from "./core/tab";
import createHTMLElement from "./utils/createElement";
import "xterm/css/xterm.css";
import "./assets/styles.css";
// @ts-ignore TODO: declare png & svg
import logo from "../../media/logo.png";
import type { Shell } from "./types.ts";

const api = window.api;
let tabs: Tab[] = [];
let activeTab: Tab | null = null;

const onClose = (tab: Tab) => {
  tabs = tabs.filter((t, i) => {
    if (t.id === tab.id) {
      if (activeTab?.id === tab.id) {
        // switch to previous tab or the next one
        if (tabs[i - 1]) {
          tabs[i - 1].render();
          activeTab = tabs[i - 1];
        } else {
          tabs[i + 1]?.render();
          activeTab = tabs[i + 1];
        }
      }
      return false;
    } else return true;
  });
};

const createTab = (shell?: string) => {
  const tab = new Tab(onClose, shell);
  tabs.push(tab);
  tab.tabBtn.addEventListener("click", () => {
    activeTab?.hide();
    tab.render();
    activeTab = tab;
  });
  // render it
  tab.tabBtn.click();
};

const prepareShellSelect = async (selectElement: HTMLSelectElement) => {
  // shell selection
  const shells: Shell[] = await api.getAvailableShells();
  console.log(shells);
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
    // because change event doesn't catch same previous value
    unSelect();
  });
};

function createUI() {
  window.addEventListener("DOMContentLoaded", () => {
    const nav = createHTMLElement("nav", "nav");
    const logoConainer = createHTMLElement("img", "title-bar-logo");
    const tabsList = createHTMLElement("ul", "nav-list");
    const newTabBtn = createHTMLElement("button", "new-tab-button");
    const shellSelectELement = createHTMLElement("select", "shell-select");
    const main = createHTMLElement("div", "main");

    newTabBtn.innerText = "+";
    logoConainer.src = logo;

    nav.append(logoConainer, tabsList, newTabBtn, shellSelectELement);
    document.querySelector("body")?.append(nav, main);

    prepareShellSelect(shellSelectELement);

    newTabBtn.addEventListener("click", () => {
      createTab();
    });

    // new tab
    window.addEventListener("keyup", (e) => {
      if (e.key === "t" && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.stopPropagation();
        newTabBtn.click();
      }
    });

    // TODO: move into the TabManager class when added
    // when the window resized, resize the active tab
    api.onResize(() => {
      activeTab?.resize();
    });
    // open the created tab
    newTabBtn.click();
  });
}

function init() {
  createUI();
}

init();
