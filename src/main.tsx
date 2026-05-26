import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    let updateRefreshRequested = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (updateRefreshRequested) {
        return;
      }

      updateRefreshRequested = true;
      window.dispatchEvent(new CustomEvent("timePilot:updateActivated"));
    });

    const notifyUpdateAvailable = (
      registration: ServiceWorkerRegistration
    ): void => {
      if (!registration.waiting || !navigator.serviceWorker.controller) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent("timePilot:updateAvailable", {
          detail: {
            apply: () => {
              registration.waiting?.postMessage({ type: "SKIP_WAITING" });
            },
          },
        })
      );
    };

    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .then((registration) => {
        notifyUpdateAvailable(registration);

        const checkForUpdate = (): void => {
          if (navigator.onLine) {
            void registration.update().then(() => {
              notifyUpdateAvailable(registration);
            });
          }
        };

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          installingWorker?.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              notifyUpdateAvailable(registration);
            }
          });
        });

        window.addEventListener("online", checkForUpdate);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkForUpdate();
          }
        });

        checkForUpdate();
      });
  });
}
