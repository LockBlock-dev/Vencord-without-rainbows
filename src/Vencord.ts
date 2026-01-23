/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This file incorporates work covered by the following copyright and
 * permission notice:
 *
 *     Copyright (c) 2022 Vendicated and contributors
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// DO NOT REMOVE UNLESS YOU WISH TO FACE THE WRATH OF THE CIRCULAR DEPENDENCY DEMON!!!!!!!
import "~plugins";

export * as Api from "./api";
export * as Plugins from "./api/PluginManager";
export * as Components from "./components";
export * as Util from "./utils";
export * as Updater from "./utils/updater";
export * as Webpack from "./webpack";
export * as WebpackPatcher from "./webpack/patchWebpack";
export { PlainSettings, Settings };

import { coreStyleRootNode, initStyles } from "@api/Styles";
import { openSettingsTabModal, UpdaterTab } from "@components/settings";
import { debounce } from "@shared/debounce";
import { IS_WINDOWS } from "@utils/constants";
import { createAndAppendStyle } from "@utils/css";
import { StartAt } from "@utils/types";

import { NotificationData, showNotification } from "./api/Notifications";
import { initPluginManager, PMLogger, startAllPlugins } from "./api/PluginManager";
import { PlainSettings, Settings, SettingsStore } from "./api/Settings";
import { relaunch } from "./utils/native";
import { checkForUpdates, update, UpdateLogger } from "./utils/updater";
import { onceReady } from "./webpack";
import { patches } from "./webpack/patchWebpack";

if (IS_REPORTER) {
    require("./debug/runReporter");
}

let notifiedForUpdatesThisSession = false;

async function runUpdateCheck() {
    if (IS_UPDATER_DISABLED) return;

    const notify = (data: NotificationData) => {
        if (notifiedForUpdatesThisSession) return;
        notifiedForUpdatesThisSession = true;

        setTimeout(() => showNotification({
            permanent: true,
            noPersist: true,
            ...data
        }), 10_000);
    };

    try {
        const isOutdated = await checkForUpdates();
        if (!isOutdated) return;

        if (Settings.autoUpdate) {
            await update();
            if (Settings.autoUpdateNotification) {
                notify({
                    title: "Vencord has been updated!",
                    body: "Click here to restart",
                    onClick: relaunch
                });
            }
            return;
        }

        notify({
            title: "A Vencord update is available!",
            body: "Click here to view the update",
            onClick: () => openSettingsTabModal(UpdaterTab!)
        });
    } catch (err) {
        UpdateLogger.error("Failed to check for updates", err);
    }
}

async function init() {
    await onceReady;
    startAllPlugins(StartAt.WebpackReady);

    if (!IS_WEB && !IS_UPDATER_DISABLED) {
        runUpdateCheck();

        // this tends to get really annoying, so only do this if the user has auto-update without notification enabled
        if (Settings.autoUpdate && !Settings.autoUpdateNotification) {
            setInterval(runUpdateCheck, 1000 * 60 * 30); // 30 minutes
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

initPluginManager();
initStyles();
startAllPlugins(StartAt.Init);
init();

document.addEventListener("DOMContentLoaded", () => {
    startAllPlugins(StartAt.DOMContentLoaded);

    // FIXME
    if (IS_DISCORD_DESKTOP && Settings.winNativeTitleBar && IS_WINDOWS) {
        createAndAppendStyle("vencord-native-titlebar-style", coreStyleRootNode).textContent = "[class*=titleBar]{display: none!important}";
    }
}, { once: true });
