/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and Vencord contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export * as Api from "./api";
export * as Components from "./components";
export * as Plugins from "./plugins";
export * as Util from "./utils";
export * as QuickCss from "./utils/quickCss";
export * as Updater from "./utils/updater";
export * as Webpack from "./webpack";
export { PlainSettings, Settings };

import "./utils/quickCss";
import "./webpack/patchWebpack";

import { openUpdaterModal } from "@components/VencordSettings/UpdaterTab";
import { StartAt } from "@utils/types";

import { showNotification } from "./api/Notifications";
import { PlainSettings, Settings } from "./api/Settings";
import { patches, PMLogger, startAllPlugins } from "./plugins";
import { relaunch } from "./utils/native";
import { checkForUpdates, update, UpdateLogger } from "./utils/updater";
import { onceReady } from "./webpack";

if (IS_REPORTER) {
    require("./debug/runReporter");
}

async function init() {
    await onceReady;
    startAllPlugins(StartAt.WebpackReady);

    if (!IS_WEB && !IS_UPDATER_DISABLED) {
        try {
            const isOutdated = await checkForUpdates();
            if (!isOutdated) return;

            if (Settings.autoUpdate) {
                await update();
                if (Settings.autoUpdateNotification)
                    setTimeout(() => showNotification({
                        title: "Vencord has been updated!",
                        body: "Click here to restart",
                        permanent: true,
                        noPersist: true,
                        onClick: relaunch
                    }), 10_000);
                return;
            }

            setTimeout(() => showNotification({
                title: "A Vencord update is available!",
                body: "Click here to view the update",
                permanent: true,
                noPersist: true,
                onClick: openUpdaterModal!
            }), 10_000);
        } catch (err) {
            UpdateLogger.error("Failed to check for updates", err);
        }
    }

    if (IS_DEV) {
        const pendingPatches = patches.filter(p => !p.all && p.predicate?.() !== false);
        if (pendingPatches.length)
            PMLogger.warn(
                "Webpack has finished initialising, but some patches haven't been applied yet.",
                "This might be expected since some Modules are lazy loaded, but please verify",
                "that all plugins are working as intended.",
                "You are seeing this warning because this is a Development build of Vencord.",
                "\nThe following patches have not been applied:",
                "\n\n" + pendingPatches.map(p => `${p.plugin}: ${p.find}`).join("\n")
            );
    }
}

startAllPlugins(StartAt.Init);
init();

document.addEventListener("DOMContentLoaded", () => {
    startAllPlugins(StartAt.DOMContentLoaded);

    if (IS_DISCORD_DESKTOP && Settings.winNativeTitleBar && navigator.platform.toLowerCase().startsWith("win")) {
        document.head.append(Object.assign(document.createElement("style"), {
            id: "vencord-native-titlebar-style",
            textContent: "[class*=titleBar]{display: none!important}"
        }));
    }
}, { once: true });
