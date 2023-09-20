import createHTMLElement from "./createElement";

type Dropdown = {
  el: HTMLElement;
};

type DropdownItem = {
  label: string;
  onClick: () => void;
};

type DropdownProps = {
  list: DropdownItem[];
};

export default function createDropdown({ list }: DropdownProps): Dropdown {
  const container = createHTMLElement("ul", "dropdown");
  document.querySelector("body")?.appendChild(container);

  list.forEach((item) => {
    const li = createHTMLElement("li", "dropdown__item");
    li.innerText = item.label;
    li.onclick = item.onClick;
    li.contentEditable = "true";
    container.appendChild(li);
  });

  return {
    el: container,
  };
}
