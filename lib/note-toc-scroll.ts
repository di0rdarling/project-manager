const HEADING_SCROLL_OFFSET = 24;

function getHeadingIdFromHref(href: string): string | null {
  const hashIndex = href.lastIndexOf("#");
  if (hashIndex === -1) {
    return null;
  }

  const id = href.slice(hashIndex + 1);
  if (!id) {
    return null;
  }

  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export function assignDomHeadingIds(contentElement: HTMLElement) {
  const headingMap: Record<string, number> = {};

  contentElement.querySelectorAll("h1, h2, h3").forEach((heading) => {
    if (heading.id) {
      return;
    }

    let id =
      heading.textContent
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") ?? "";

    if (!id) {
      id = "section";
    }

    if (headingMap[id] !== undefined) {
      headingMap[id] += 1;
      heading.id = `${id}-${headingMap[id]}`;
      return;
    }

    headingMap[id] = 0;
    heading.id = id;
  });
}

function findNoteHeading(
  contentElement: HTMLElement,
  headingId: string,
): HTMLElement | null {
  try {
    const bySelector = contentElement.querySelector(
      `#${CSS.escape(headingId)}`,
    );
    if (bySelector instanceof HTMLElement) {
      return bySelector;
    }
  } catch {
    // Fall through to getElementById.
  }

  const byId = document.getElementById(headingId);
  return byId instanceof HTMLElement ? byId : null;
}

export function scrollToNoteHeading(
  contentElement: HTMLElement,
  headingId: string,
) {
  const heading = findNoteHeading(contentElement, headingId);

  if (!heading) {
    return;
  }

  const scrollContainer = document.querySelector("main");

  if (!(scrollContainer instanceof HTMLElement)) {
    heading.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const headingTop =
    scrollContainer.scrollTop +
    heading.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top -
    HEADING_SCROLL_OFFSET;

  scrollContainer.scrollTo({
    top: Math.max(headingTop, 0),
    behavior: "smooth",
  });
}

export function createNoteTocClickHandler(contentElement: HTMLElement) {
  return (event: MouseEvent) => {
    event.preventDefault();

    const target = event.currentTarget as HTMLAnchorElement | null;
    const href = target?.getAttribute("href");

    if (!href) {
      return;
    }

    const headingId = getHeadingIdFromHref(href);
    if (!headingId) {
      return;
    }

    scrollToNoteHeading(contentElement, headingId);
  };
}
