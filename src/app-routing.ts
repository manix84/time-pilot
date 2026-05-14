export const isShowcaseMode = (): boolean => {
  const url = new URL(window.location.href);

  return url.searchParams.get("mode") === "showcase" || url.hash === "#showcase";
};

export const isPwaRoute = (): boolean => {
  const url = new URL(window.location.href);

  return /\/pwa(?:\/index\.html|\/)?$/.test(url.pathname);
};
