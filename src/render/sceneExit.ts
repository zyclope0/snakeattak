type SceneEvents = {
  once: (event: string, listener: () => void) => unknown;
  off: (event: string, listener: () => void) => unknown;
};

/** Phaser removes/destroys scenes without necessarily shutting them down first. */
export function onSceneExit(events: SceneEvents, cleanup: () => void) {
  const exit = () => {
    events.off('shutdown', exit);
    events.off('destroy', exit);
    cleanup();
  };
  events.once('shutdown', exit);
  events.once('destroy', exit);
}
