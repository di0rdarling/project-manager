"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ProjectDetailSectionId } from "@/lib/project-detail-sections";
import { scrollToElement } from "@/lib/scroll-to-element";

type SectionRegistration = {
  expand: () => void;
  getElement: () => HTMLElement | null;
};

type ProjectSectionNavContextValue = {
  activeSectionId: ProjectDetailSectionId | null;
  navigateToSection: (sectionId: ProjectDetailSectionId) => void;
  resetActiveSection: () => void;
  registerSection: (
    sectionId: ProjectDetailSectionId,
    registration: SectionRegistration,
  ) => void;
  unregisterSection: (sectionId: ProjectDetailSectionId) => void;
};

const ProjectSectionNavContext =
  createContext<ProjectSectionNavContextValue | null>(null);

export function ProjectSectionNavProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sectionsRef = useRef(
    new Map<ProjectDetailSectionId, SectionRegistration>(),
  );
  const [activeSectionId, setActiveSectionId] =
    useState<ProjectDetailSectionId | null>(null);

  const registerSection = useCallback(
    (
      sectionId: ProjectDetailSectionId,
      registration: SectionRegistration,
    ) => {
      sectionsRef.current.set(sectionId, registration);
    },
    [],
  );

  const unregisterSection = useCallback(
    (sectionId: ProjectDetailSectionId) => {
      sectionsRef.current.delete(sectionId);
    },
    [],
  );

  const navigateToSection = useCallback(
    (sectionId: ProjectDetailSectionId) => {
      const section = sectionsRef.current.get(sectionId);
      if (!section) {
        return;
      }

      section.expand();
      setActiveSectionId(sectionId);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToElement(section.getElement());
        });
      });
    },
    [],
  );

  const resetActiveSection = useCallback(() => {
    setActiveSectionId(null);
  }, []);

  const value = useMemo(
    () => ({
      activeSectionId,
      navigateToSection,
      resetActiveSection,
      registerSection,
      unregisterSection,
    }),
    [
      activeSectionId,
      navigateToSection,
      resetActiveSection,
      registerSection,
      unregisterSection,
    ],
  );

  return (
    <ProjectSectionNavContext.Provider value={value}>
      {children}
    </ProjectSectionNavContext.Provider>
  );
}

export function useProjectSectionNav() {
  return useContext(ProjectSectionNavContext);
}
