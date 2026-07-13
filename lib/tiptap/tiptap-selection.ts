import type { Editor } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";

export function getEditorSelectionHtml(editor: Editor): string | null {
  const { empty, from, to } = editor.state.selection;

  if (empty) {
    return null;
  }

  const slice = editor.state.doc.slice(from, to);
  const fragment = DOMSerializer.fromSchema(editor.schema).serializeFragment(
    slice.content,
  );
  const container = document.createElement("div");
  container.appendChild(fragment);

  const html = container.innerHTML.trim();
  return html || null;
}

export function getEditorSelectionRange(editor: Editor) {
  const { from, to } = editor.state.selection;
  return { from, to };
}

const STICKY_TOOLBAR_CLEARANCE = 48;
const BUBBLE_MENU_GAP = 8;

export function getBubbleMenuPlacement(editor: Editor): "top" | "bottom" {
  const { view, state } = editor;

  if (state.selection.empty) {
    return "top";
  }

  const { from, to } = state.selection;
  const startCoords = view.coordsAtPos(from);
  const endCoords = view.coordsAtPos(to);
  const selectionTop = Math.min(startCoords.top, endCoords.top);
  const editorRect = view.dom.getBoundingClientRect();
  const stickyToolbarBottom = editorRect.top + STICKY_TOOLBAR_CLEARANCE;

  if (selectionTop <= stickyToolbarBottom + BUBBLE_MENU_GAP) {
    return "bottom";
  }

  return "top";
}

export const bubbleMenuFloatingOptions = {
  offset: BUBBLE_MENU_GAP,
  flip: {
    padding: {
      top: STICKY_TOOLBAR_CLEARANCE,
    },
    fallbackPlacements: ["bottom", "top"] as Array<"bottom" | "top">,
  },
};
