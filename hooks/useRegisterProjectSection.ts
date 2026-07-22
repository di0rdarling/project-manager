"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useProjectSectionNav } from "@/components/views/ProjectDetail/ProjectSectionNavContext";

export function useRegisterProjectSection(
  sectionId: string | undefined,
  sectionRef: RefObject<HTMLElement | null>,
  onExpand?: () => void,
) {
  const nav = useProjectSectionNav();
  const onExpandRef = useRef(onExpand);
  onExpandRef.current = onExpand;

  useEffect(() => {
    if (!sectionId || !nav) {
      return;
    }

    nav.registerSection(sectionId, {
      expand: () => {
        onExpandRef.current?.();
      },
      getElement: () => sectionRef.current,
    });

    return () => {
      nav.unregisterSection(sectionId);
    };
  }, [sectionId, nav, sectionRef]);
}
