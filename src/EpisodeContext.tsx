import React, { createContext, useContext } from "react";
import type { Episode } from "./episode";

const Ctx = createContext<Episode | null>(null);

export const EpisodeProvider: React.FC<{ episode: Episode; children: React.ReactNode }> = ({ episode, children }) => (
  <Ctx.Provider value={episode}>{children}</Ctx.Provider>
);

export const useEpisode = (): Episode => {
  const ep = useContext(Ctx);
  if (!ep) throw new Error("useEpisode must be used inside EpisodeProvider");
  return ep;
};
