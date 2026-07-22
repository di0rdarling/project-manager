import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { handleRichTextPaste } from "@/lib/tiptap/handle-rich-text-paste";

export const MarkdownTablePaste = Extension.create({
  name: "markdownTablePaste",

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: new PluginKey("markdownTablePaste"),
        props: {
          handlePaste: (_view, event) => {
            return handleRichTextPaste(editor, event);
          },
        },
      }),
    ];
  },
});
