/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RendererSettings } from "@main/settings";
import { app } from "electron";

app.on("browser-window-created", (_, win) => {
    win.webContents.on("frame-created", (_, { frame }) => {
        frame.once("dom-ready", () => {
            if (!RendererSettings.store.plugins?.RisiBank?.enabled) return;

            if (frame.url.includes("risibank.fr/embed"))
                frame.executeJavaScript(`
                document.querySelector(".actions-left")?.remove?.();
                document.querySelector(".mt-4")?.classList?.remove?.("mt-4");
                `);
        });
    });
});
