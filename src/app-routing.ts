export const isShowcaseMode = (): boolean => {
  const url = new URL(window.location.href);

  return url.searchParams.get("mode") === "showcase" || url.hash === "#showcase";
};

export const isPwaRoute = (): boolean => {
  const url = new URL(window.location.href);

  return (
    import.meta.env.VITE_APP_MODE === "pwa" ||
    /\/pwa(?:\/index\.html|\/)?$/.test(url.pathname)
  );
};

export const isAboutRoute = (): boolean => {
  const url = new URL(window.location.href);

  return /\/about(?:\/index\.html|\/)?$/.test(url.pathname);
};

export const isPwaMode = (): boolean => {
  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    standaloneNavigator.standalone === true ||
    window.matchMedia?.("(display-mode: fullscreen)").matches === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches === true
  );
};
