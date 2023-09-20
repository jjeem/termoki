import createHTMLElement from "../../utils/createElement";
import SplitPane from "./SplitPane";

export type ResizeHandler = {
  element: HTMLDivElement;
  // TODO: likely not needed
  dispose: () => void;
};

/**
 * The resize approach:
 * determine calculate the both boxes (box stands for terminal wrapper) percent to the container (the split pane)
 * then determine the distance the resizeHandler has moved in percent and subtract it from box1 percent (the left/up one)
 * for box2, it's the sum of the two boxes' initiale percent minus box1 percent
 */

export const createResizeHandler = (
  type: "VERTICAL" | "HORIZONTAL",
  splitPane: SplitPane,
): ResizeHandler => {
  const horizontal = [
    "width",
    "clientX",
    "left",
    "split-pane__resizer-hoizontal",
  ] as const;
  const vertical = [
    "height",
    "clientY",
    "top",
    "split-pane__resizer-vertical",
  ] as const;
  const directionValues = type === "HORIZONTAL" ? horizontal : vertical;

  const resizer = createHTMLElement(
    "div",
    "split-pane__resizer",
    directionValues[3],
  );

  resizer.addEventListener("mousedown", onDragStart);
  // "Size" means either width or height
  let box1Size = 0;
  let box2Size = 0;
  let box1SizePercent = 0;
  let box2SizePercent = 0;
  let sumSizePercent = 0;

  function onDragStart() {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", onDragEnd);
    const container = resizer.parentElement as HTMLDivElement;
    const box1 = resizer.previousElementSibling as HTMLDivElement;
    const box2 = resizer.nextElementSibling as HTMLDivElement;
    const conatinerWidth = parseInt(
      getComputedStyle(container)[directionValues[0]],
    );
    box1Size = parseInt(getComputedStyle(box1)[directionValues[0]]);
    box2Size = parseInt(getComputedStyle(box2)[directionValues[0]]);

    box1SizePercent = (box1Size * 100) / conatinerWidth;
    box2SizePercent = (box2Size * 100) / conatinerWidth;
    sumSizePercent = Number((box1SizePercent + box2SizePercent).toFixed(0));
  }

  function onDragEnd() {
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", onDragEnd);
    splitPane.resizeTerms();
  }

  function onDrag(e: MouseEvent) {
    if (e.x === 0 && e.y === 0) return;

    const container = resizer.parentElement as HTMLDivElement;
    // box1 is the left or top box
    const box1 = resizer.previousElementSibling as HTMLDivElement;
    const box2 = resizer.nextElementSibling as HTMLDivElement;

    const resizerPosition = resizer.getBoundingClientRect()[directionValues[2]];
    const box1Size = parseInt(getComputedStyle(box1)[directionValues[0]]);
    const box2Size = parseInt(getComputedStyle(box2)[directionValues[0]]);

    const containerWidth = parseInt(
      getComputedStyle(container)[directionValues[0]],
    );

    // distance in percentage to the container
    // note: if destance > 0 : dragging towards the left and vice versa
    const distance =
      ((resizerPosition - e[directionValues[1]]) * 100) / containerWidth;

    // check if minimum size reached
    if (distance > 0 && box1Size <= 75) return;
    if (distance < 0 && box2Size <= 75) return;

    const box1FlexBasisPercent = ((box1Size * 100) / containerWidth).toFixed(0);

    const b1 = Number(box1FlexBasisPercent) - Number(distance.toFixed(0));
    const b2 = sumSizePercent - b1;

    box1.style.flexBasis = `${b1}%`;
    box2.style.flexBasis = `${b2.toFixed(0)}%`;
  }

  return {
    element: resizer,
    dispose: () => resizer.remove(),
  };
};
