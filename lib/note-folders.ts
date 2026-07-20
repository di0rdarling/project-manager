import type { SelectOption } from "@/components/ui/inputs/Select";

export type FolderTreeNode = {
  _id: string;
  parentFolderId: string | null;
  name: string;
};

export function getDescendantFolderIds(
  folders: FolderTreeNode[],
  folderId: string,
): Set<string> {
  const childrenByParent = new Map<string | null, string[]>();

  for (const folder of folders) {
    const parentId = folder.parentFolderId;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(folder._id);
    childrenByParent.set(parentId, siblings);
  }

  const descendants = new Set<string>();
  const queue = [...(childrenByParent.get(folderId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || descendants.has(currentId)) {
      continue;
    }

    descendants.add(currentId);
    queue.push(...(childrenByParent.get(currentId) ?? []));
  }

  return descendants;
}

export function buildFolderOptions(
  folders: FolderTreeNode[],
  options?: { excludeIds?: Iterable<string> },
): SelectOption[] {
  const excludeIds = new Set(options?.excludeIds ?? []);
  const childrenByParent = new Map<string | null, FolderTreeNode[]>();

  for (const folder of folders) {
    if (excludeIds.has(folder._id)) {
      continue;
    }

    const parentId = folder.parentFolderId;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(folder);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const result: SelectOption[] = [];

  function walk(parentId: string | null, depth: number) {
    const children = childrenByParent.get(parentId) ?? [];

    for (const child of children) {
      const indent = depth > 0 ? `${"— ".repeat(depth)}` : "";
      result.push({
        value: child._id,
        label: `${indent}${child.name}`,
      });
      walk(child._id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
}

export function getFolderBreadcrumbTrail<T extends FolderTreeNode>(
  folders: T[],
  folderId: string | null,
): T[] {
  if (!folderId) {
    return [];
  }

  const foldersById = new Map(folders.map((folder) => [folder._id, folder]));
  const trail: T[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = foldersById.get(currentId);
    if (!folder) {
      break;
    }

    trail.unshift(folder);
    currentId = folder.parentFolderId;
  }

  return trail;
}

export function getChildFolders<T extends FolderTreeNode>(
  folders: T[],
  parentFolderId: string | null,
): T[] {
  return folders
    .filter((folder) => folder.parentFolderId === parentFolderId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
