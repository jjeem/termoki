import { v4 as uuidv4 } from "uuid";
import { createResizeHandler } from "./resizer";
import { Term } from "../term";
import createHTMLElement from "../../utils/createElement";

class SplitPane {
  uid: string = uuidv4();
  type: "VERTICAL" | "HORIZONTAL";
  container: HTMLElement = document.createElement("div");
  terms: Term[] = [];
  childPanes: SplitPane[] = [];
  childWrappers: HTMLDivElement[] = [];
  parentPane?: SplitPane;

  constructor(type: "VERTICAL" | "HORIZONTAL", term: Term) {
    this.type = type;
    this.parentPane = term.splitPane;
    const className =
      this.type === "VERTICAL"
        ? "split_pane_vertical"
        : "split_pane_horizontal";
    this.container.classList.add("split-pane", className);

    if (term.splitPane) {
      term.splitPane.addChildPane(
        this,
        Number(term.container.parentElement?.dataset?.index as string),
      );
      term.splitPane.removeTerm(term.id);
    } else {
      const parent = term.container.parentElement;
      term.container.remove();
      parent?.appendChild(this.container);
    }
    this.addTerm(term);
  }

  resizeTerms() {
    this.terms.forEach((t) => t.resize());
  }

  createWrapper(index?: number) {
    const wrapper = createHTMLElement("div", "split-pane__term-wrapper");
    wrapper.dataset.index =
      index !== undefined ? `${index}` : `${this.container.childElementCount}`;
    return wrapper;
  }

  renderChild(child: HTMLDivElement, index?: number) {
    if (typeof index !== "number") {
      this.childWrappers.push(child);
      this.renderChildren();
    } else {
      let list = this.childWrappers;
      list = list.slice(0, index).concat(child, list.slice(index, list.length));
      this.childWrappers = [...list];
      this.renderChildren();
    }
  }

  renderChildren() {
    this.childWrappers.forEach((el, i) => {
      el.dataset.index = `${i}`;
      el.style.flexBasis = `${(100 / this.childWrappers.length).toFixed(0)}%`;
    });
    this.container.replaceChildren();
    for (let i = 0; i < this.childWrappers.length; i++) {
      if (i !== 0) {
        const resizer = createResizeHandler(this.type, this);
        this.container.append(resizer.element);
      }
      this.container.append(this.childWrappers[i]);
    }
  }

  removeChildWrapper(index: number) {
    this.childWrappers = this.childWrappers.filter((w) => {
      if (Number(w.dataset.index) === index) {
        w.remove();
        return false;
      }
      return true;
    });
    this.renderChildren();
  }

  dispose() {
    const lastTerm = this.terms[0];
    const lastPane = this.childPanes[0];
    this.terms = [];
    this.childPanes = [];

    if (lastTerm) {
      if (this.parentPane) {
        this.parentPane.addTerm(
          lastTerm,
          parseInt(this.container.parentElement?.dataset.index as string),
        );
      } else {
        lastTerm.appendTo(this.container.parentElement as HTMLElement);
        lastTerm.splitPane = undefined;
      }
    }
    if (lastPane) {
      if (this.parentPane) {
        const parentPane = this.parentPane;
        if (parentPane.type === lastPane.type) {
          console.log(
            "oiiiiiiiii",
            this.container.parentElement?.dataset.index,
          );
          // same type so pane no longer needed. also increase index by index "i" to ensure same order
          let index = Number(this.container.parentElement?.dataset.index);
          lastPane.terms.forEach((t) =>
            parentPane.addTerm(
              t,
              Number(this.container.parentElement?.dataset.index as string) +
                index++,
            ),
          );
          lastPane.childPanes.forEach((p) =>
            parentPane.addChildPane(
              p,
              Number(p.container.parentElement?.dataset.index as string) +
                index++,
            ),
          );
        } else {
          this.parentPane.addChildPane(
            lastPane,
            parseInt(this.container.parentElement?.dataset.index as string),
          );
        }
      } else {
        this.container.parentElement?.append(lastPane.container);
        lastPane.parentPane = undefined;
      }
    }

    this.unmount();
  }

  addChildPane(pane: SplitPane, index?: number) {
    pane.parentPane = this;
    this.childPanes.push(pane);
    const wrapper = this.createWrapper(index);
    wrapper.append(pane.container);
    this.renderChild(wrapper, index);
  }

  removeChildPane(uid: string) {
    const pane = this.childPanes.find((pane) => pane.uid === uid);
    const wrapper = pane?.container.parentElement;
    if (wrapper?.dataset.index)
      this.removeChildWrapper(Number(wrapper?.dataset.index));
    this.childPanes = this.childPanes.filter((pane) => pane.uid !== uid);
    this.shouldDisposeSelf();
  }

  addTerm(term: Term, index?: number) {
    const wrapper = this.createWrapper(index);

    this.renderChild(wrapper, parseInt(wrapper.dataset.index as string));
    term.appendTo(wrapper);
    term.splitPane = this;
    this.terms.push(term);
    term.tab.resize();
  }

  removeTerm(id: number) {
    const term = this.terms.find((t) => t.id === id);
    const wrapper = term?.container.parentElement;
    if (wrapper?.dataset.index)
      this.removeChildWrapper(Number(wrapper?.dataset.index));
    this.terms = this.terms.filter((t) => t.id !== id);
    this.shouldDisposeSelf();
  }

  dangerouslyRemoveTerm(id: number) {
    const term = this.terms.find((t) => t.id === id);
    const wrapper = term?.container.parentElement;
    if (wrapper?.dataset.index)
      this.removeChildWrapper(Number(wrapper?.dataset.index));
    this.terms = this.terms.filter((t) => t.id !== id);
  }

  shouldDisposeSelf() {
    if (this.terms.length + this.childPanes.length === 1) {
      this.dispose();
    }
  }

  unmount() {
    this.parentPane?.removeChildPane(this.uid);
    this.container.remove();
  }
}

export default SplitPane;
