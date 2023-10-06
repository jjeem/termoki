import TabManager from "./core/tab/TabManager";
import "xterm/css/xterm.css";
import "./assets/styles.css";

const api = window.api;

// TODO: abstract
const registerEventListeners = (tabManager: TabManager) => {
  // New tab (Ctrl + t)
  window.addEventListener("keyup", (e) => {
    if (e.key === "t" && e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.stopPropagation();
      tabManager.createTab();
    }
  });
  // Close tab (Ctrl + Shift + w)
  window.addEventListener("keyup", (e) => {
    if (e.key === "W" && e.ctrlKey && e.shiftKey && !e.altKey) {
      e.stopPropagation();
      tabManager.activeTab?.close();
    }
  });
};

function init() {
  const tabManager = new TabManager();

  registerEventListeners(tabManager);

  api.onResize(() => {
    tabManager.activeTab?.resize();
    console.log("resized active tab");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  init();
});
