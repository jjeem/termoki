import createHTMLElement from "./createElement";

type DropdownItem = {
  label: string;
  onClick: () => void;
  command?: string;
};

type DropdownProps = {
  x: string | number;
  y: string | number;
  list: DropdownItem[];
};

/**
 * TODO: not completed yet
 */
function createDropdown({ x, y, list }: DropdownProps): HTMLElement {
  console.log({ x, y });

  let provider = document.getElementById("dropdown-provider");

  if (!provider) {
    provider = createHTMLElement("div");
    provider.id = "dropdown-provider";

    document.body.append(provider);
  }

  const dropdownElement = createHTMLElement("div", "dropdown");
  provider.appendChild(dropdownElement);

  dropdownElement.style.left = typeof x === "number" ? `${x}px` : x;
  dropdownElement.style.top = typeof y === "number" ? `${y}px` : y;

  dropdownElement.tabIndex = 1;

  dropdownElement.focus();

  list.forEach((item) => {
    const optionElement = createHTMLElement("div", "dropdown__item");

    let commandElement: HTMLSpanElement | undefined;
    if (item.command) {
      commandElement = createHTMLElement("span", "command-text");
      commandElement.innerText = item.command;
    }

    // option.innerText = item.label;
    optionElement.append(item.label, commandElement || "");
    optionElement.addEventListener("click", () => {
      item.onClick();
      // close the dropdown
      dropdownElement.blur();
    });
    dropdownElement.appendChild(optionElement);
  });

  dropdownElement.addEventListener("blur", () => {
    dropdownElement.remove();
  });

  return dropdownElement;
}

export default createDropdown;
