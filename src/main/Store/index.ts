import SettingsStore from "./settings";

export class Store {
  private static store: Store | null = null;
  settings: SettingsStore;

  private constructor() {
    this.settings = new SettingsStore();
  }

  static getStore() {
    if (Store.store) {
      return Store.store;
    }

    Store.store = new Store();
    return Store.store;
  }
}
