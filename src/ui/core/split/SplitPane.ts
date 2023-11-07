import createResizeHandler from "./resizer";
import { Term } from "../term";
import createHTMLElement from "../../utils/createElement";

class SplitPane {
  static idPointer = 1;
  id = SplitPane.idPointer++;
  container: HTMLDivElement;
  readonly type: "VERTICAL" | "HORIZONTAL";
  private parentPane?: SplitPane;
  private terms: Term[] = [];
  private childPanes: SplitPane[] = [];
  private childWrappers: HTMLDivElement[] = [];

  constructor(type: "VERTICAL" | "HORIZONTAL", term: Term) {
    this.type = type;
    this.parentPane = term.splitPane;
    const directionClassName =
      this.type === "VERTICAL"
        ? "split_pane_vertical"
        : "split_pane_horizontal";
    this.container = createHTMLElement("div", "split-pane", directionClassName);

    this.addSelfToParent(term);
    this.addTerm(term);
  }

  private addSelfToParent(term: Term) {
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
  }

  resizeTerms() {
    this.terms.forEach((term) => term.resize());
  }

  createWrapper(index?: number) {
    const wrapper = createHTMLElement("div", "split-pane__term-wrapper");
    wrapper.dataset.index =
      index !== undefined ? `${index}` : `${this.container.childElementCount}`;
    return wrapper;
  }

  private renderChild(child: HTMLDivElement, index?: number) {
    if (typeof index === "number") {
      let list = this.childWrappers;
      list = list.slice(0, index).concat(child, list.slice(index, list.length));
      this.childWrappers = [...list];
    } else {
      this.childWrappers.push(child);
    }

    this.renderChildren();
  }

  private renderChildren() {
    this.childWrappers.forEach((el, i) => {
      el.dataset.index = `${i}`;
      el.style.flexBasis = `${(100 / this.childWrappers.length).toFixed(0)}%`;
    });
    this.container.replaceChildren();

    for (let i = 0; i < this.childWrappers.length; i++) {
      if (i !== 0) {
        const resizer = createResizeHandler(this.type, this);
        this.container.append(resizer);
      }
      this.container.append(this.childWrappers[i]);
    }
  }

  private removeChildWrapper(index: string) {
    this.childWrappers = this.childWrappers.filter((wrapper) => {
      if (wrapper.dataset.index === index) {
        wrapper.remove();
        return false;
      }
      return true;
    });
    this.renderChildren();
  }

  addChildPane(pane: SplitPane, index?: number) {
    pane.parentPane = this;
    this.childPanes.push(pane);

    const wrapper = this.createWrapper(index);
    wrapper.append(pane.container);
    this.renderChild(wrapper, index);
  }

  removeChildPane(id: number) {
    const pane = this.childPanes.find((pane) => pane.id === id);
    const wrapper = pane?.container.parentElement;

    if (wrapper?.dataset.index) {
      this.removeChildWrapper(wrapper?.dataset.index);
    }

    this.childPanes = this.childPanes.filter((pane) => pane.id !== id);
    this.shouldDisposeSelf();
  }

  addTerm(term: Term, index?: number) {
    const wrapper = this.createWrapper(index);
    term.splitPane = this;

    this.renderChild(wrapper, parseInt(wrapper.dataset.index as string));
    term.appendTo(wrapper);
    this.terms.push(term);
    term.tab.resize();
  }

  removeTerm(id: number) {
    const term = this.terms.find((term) => term.id === id);
    const wrapper = term?.container.parentElement;

    if (wrapper?.dataset.index) {
      this.removeChildWrapper(wrapper?.dataset.index);
    }

    this.terms = this.terms.filter((term) => term.id !== id);

    this.shouldDisposeSelf();
  }

  private appendLastTermToParent(term: Term) {
    if (this.parentPane) {
      this.parentPane.addTerm(
        term,
        parseInt(this.container.parentElement?.dataset.index as string),
      );
    } else {
      term.appendTo(this.container.parentElement as HTMLElement);
      term.splitPane = undefined;
    }
  }

  private appendLastChildPaneToParent(splitPane: SplitPane) {
    if (this.parentPane) {
      const parentPane = this.parentPane;
      if (parentPane.type === splitPane.type) {
        // same type so the splitpane is no longer needed.
        // increase data-index attribute by index "i" to ensure same order
        let index = Number(this.container.parentElement?.dataset.index);

        splitPane.terms.forEach((term) => {
          parentPane.addTerm(
            term,
            Number(this.container.parentElement?.dataset.index as string) +
              index,
          );
          index++;
        });

        splitPane.childPanes.forEach((p) => {
          parentPane.addChildPane(
            p,
            Number(p.container.parentElement?.dataset.index as string) + index,
          );
          index++;
        });
      } else {
        this.parentPane.addChildPane(
          splitPane,
          parseInt(this.container.parentElement?.dataset.index as string),
        );
      }
    } else {
      this.container.parentElement?.append(splitPane.container);
      splitPane.parentPane = undefined;
    }
  }

  private dispose() {
    const lastTerm = this.terms[0];
    const lastPane = this.childPanes[0];

    if (lastTerm) {
      // console.log("terms: ", this.terms);
      this.appendLastTermToParent(lastTerm);
    }

    if (lastPane) {
      this.appendLastChildPaneToParent(lastPane);
    }

    this.unmount();
  }

  private shouldDisposeSelf() {
    if (this.terms.length + this.childPanes.length === 1) {
      this.dispose();
    }
  }

  private unmount() {
    this.parentPane?.removeChildPane(this.id);
    this.container.remove();
  }
}

export default SplitPane;
