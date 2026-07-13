const HEADING_SCROLL_OFFSET = 24;
const EDIT_MODE_HEADING_SCROLL_OFFSET = 56;
const ACTIVE_HEADING_THRESHOLD = 10;

export function getNoteHeadingScrollOffset(isEditing: boolean) {
  return isEditing ? EDIT_MODE_HEADING_SCROLL_OFFSET : HEADING_SCROLL_OFFSET;
}

/**
 * Headings are looked up positionally (in document order) rather than by id.
 * Rich text ids are assigned when content is rendered for reading, but rich
 * text editors (e.g. Tiptap) don't necessarily preserve arbitrary `id`
 * attributes when parsing HTML into their document schema, so DOM heading
 * ids can't be relied on while editing.
 */
export function getNoteHeadingElements(contentElement: HTMLElement): HTMLElement[] {
  return Array.from(contentElement.querySelectorAll<HTMLElement>("h1, h2, h3"));
}

function getMainScrollContainer(): HTMLElement | null {
  const scrollContainer = document.querySelector("main");
  return scrollContainer instanceof HTMLElement ? scrollContainer : null;
}

export function scrollToNoteHeadingElement(heading: HTMLElement, offset = HEADING_SCROLL_OFFSET) {
  const scrollContainer = getMainScrollContainer();

  if (!scrollContainer) {
    heading.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const headingTop =
    scrollContainer.scrollTop +
    heading.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top -
    offset;

  scrollContainer.scrollTo({
    top: Math.max(headingTop, 0),
    behavior: "smooth",
  });
}

/**
 * Returns the index (within `headingElements`) of the section the user is
 * currently reading: the last heading whose top has scrolled past the
 * offset line. Uses `getBoundingClientRect`, which reflects true on-screen
 * position regardless of the CSS positioning scheme of ancestor elements
 * (unlike `offsetTop`, which can be unreliable across sticky/positioned
 * containers).
 */
export function getActiveNoteHeadingIndex(
  headingElements: HTMLElement[],
  offset = HEADING_SCROLL_OFFSET,
): number {
  const scrollContainer = getMainScrollContainer();

  if (!scrollContainer || headingElements.length === 0) {
    return -1;
  }

  const containerTop = scrollContainer.getBoundingClientRect().top;
  const threshold = offset + ACTIVE_HEADING_THRESHOLD;
  let activeIndex = -1;

  for (let i = 0; i < headingElements.length; i += 1) {
    const headingTop = headingElements[i].getBoundingClientRect().top - containerTop;
    if (headingTop <= threshold) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return activeIndex;
}
