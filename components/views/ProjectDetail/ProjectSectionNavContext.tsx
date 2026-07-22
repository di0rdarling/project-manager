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
import { scrollToElement } from "@/lib/scroll-to-element";

type SectionRegistration = {
  expand: () => void;
  getElement: () => HTMLElement | null;
};

type ProjectSectionNavContextValue = {
  activeSectionId: string | null;
  navigateToSection: (sectionId: string) => void;
  resetActiveSection: () => void;
  registerSection: (
    sectionId: string,
    registration: SectionRegistration,
  ) => void;
  unregisterSection: (sectionId: string) => void;
};

const ProjectSectionNavContext =
  createContext<ProjectSectionNavContextValue | null>(null);

export function ProjectSectionNavProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sectionsRef = useRef(new Map<string, SectionRegistration>());
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const registerSection = useCallback(
    (sectionId: string, registration: SectionRegistration) => {
      sectionsRef.current.set(sectionId, registration);
    },
    [],
  );

  const unregisterSection = useCallback((sectionId: string) => {
    sectionsRef.current.delete(sectionId);
  }, []);

  const navigateToSection = useCallback((sectionId: string) => {
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
