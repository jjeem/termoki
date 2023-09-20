export default function createHTMLElement<
  K extends keyof HTMLElementTagNameMap,
>(tagName: K, ...classNames: string[]) {
  const el = document.createElement(tagName);
  el.classList.add(...classNames);

  return el;
}
