"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Site } from "@/features/sites/types/site";

type ActiveSiteContextValue = {
  activeSite: Site;
  activeSiteId: string;
  sites: Site[];
  setActiveSiteId: (siteId: string) => void;
};

const ActiveSiteContext = createContext<ActiveSiteContextValue | null>(null);

export function ActiveSiteProvider({
  activeSite,
  children,
  setActiveSiteId,
  sites,
}: {
  activeSite: Site;
  children: ReactNode;
  setActiveSiteId: (siteId: string) => void;
  sites: Site[];
}) {
  return (
    <ActiveSiteContext.Provider
      value={{
        activeSite,
        activeSiteId: activeSite.id,
        setActiveSiteId,
        sites,
      }}
    >
      {children}
    </ActiveSiteContext.Provider>
  );
}

export function useActiveSite() {
  const context = useContext(ActiveSiteContext);

  if (!context) {
    throw new Error("useActiveSite doit etre utilise dans ActiveSiteProvider.");
  }

  return context;
}
