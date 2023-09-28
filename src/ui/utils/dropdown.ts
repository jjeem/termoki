import createHTMLElement from "./createElement";

type Dropdown = {
  element: HTMLElement;
};

type DropdownItem = {
  label: string;
  onClick: () => void;
};

type DropdownProps = {
  list: DropdownItem[];
};

/**
 * TODO: not completed yet
 */
function createDropdown({ list }: DropdownProps): Dropdown {
  const container = createHTMLElement("ul", "dropdown");
  document.querySelector("body")?.appendChild(container);

  list.forEach((item) => {
    const li = createHTMLElement("li", "dropdown__item");

    li.innerText = item.label;
    li.addEventListener("click", item.onClick);
    container.appendChild(li);
  });

  return {
    element: container,
  };
}

export default createDropdown;
