const ELEMENT_SCROLL_OFFSET = 24;

export function scrollToElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  const scrollContainer = document.querySelector("main");

  if (!(scrollContainer instanceof HTMLElement)) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const elementTop =
    scrollContainer.scrollTop +
    element.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top -
    ELEMENT_SCROLL_OFFSET;

  scrollContainer.scrollTo({
    top: Math.max(elementTop, 0),
    behavior: "smooth",
  });
}
