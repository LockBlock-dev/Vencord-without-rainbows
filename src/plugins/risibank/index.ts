/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { addChatBarButton, removeChatBarButton } from "@api/ChatButtons";
import definePlugin from "@utils/types";

import ChatBarButton from "./Button";
import { EXPRESSION_PICKER_VIEW, PLUGIN_NAME } from "./constants";
import risibankPicker from "./Picker";
import { hasEmbedPermission } from "./utils";

export default definePlugin({
    name: PLUGIN_NAME,
    description: "Brings RisiBank to the Discord client",
    version: "1.0.0",
    authors: [{
        name: "LockBlock",
        id: 926900384000249867n
    }],
    dependencies: ["ChatInputButtonAPI"],
    patches: [{
        // credits to ArjixWasTaken for the regex
        // https://github.com/ArjixWasTaken/Vencord/blob/69b0f4b2b4e3d84987c3c162316c461334febdfe/src/plugins/moreStickers/index.tsx#L80-L98
        find: ".Messages.EXPRESSION_PICKER_GIF",
        replacement: {
            match: /role:"tablist",.{10,20}\.Messages\.EXPRESSION_PICKER_CATEGORIES_A11Y_LABEL,children:(\[.*?\)\]}\)}\):null,)(.*?closePopout:\w.*?:null)/,
            replace: m => {
                const stickerTabRegex = /\w{1,2}\?(\(.+?\))\((\w{1,2}),.*?isActive:(\w{1,2})==.*?children:.{1,10}Messages.EXPRESSION_PICKER_STICKER.*?:null/;
                const res = m.replace(stickerTabRegex, (_m, jsx, tabHeaderComp, currentTab) => {
                    const isActive = `${currentTab}==="${EXPRESSION_PICKER_VIEW}"`;
                    return (
                        "$self.hasEmbedPermission()?" +
                        `${jsx}(${tabHeaderComp},{` +
                        `id:"${EXPRESSION_PICKER_VIEW}-picker-tab",` +
                        `"aria-controls":"${EXPRESSION_PICKER_VIEW}-picker-tab-panel",` +
                        `"aria-selected":${isActive},` +
                        `isActive:${isActive},` +
                        `viewType:"${EXPRESSION_PICKER_VIEW}",` +
                        `children:${jsx}("div",{children:"${PLUGIN_NAME}"})` +
                        "})" +
                        `:null,${_m}`
                    );
                });

                return res.replace(/:null,((\w{1,2})===.*?\.STICKER&&\w{1,2}\?(\(.*?\)).*?(\{.*?,onSelectSticker:.*?\})\):null)/, (_, _m, currentTab, jsx, props) => {
                    return `:null,${currentTab}==="${EXPRESSION_PICKER_VIEW}"?${jsx}($self.risibankPicker,${props}):null,${_m}`;
                });
            }
        },
    }],

    start: () => {
        addChatBarButton(PLUGIN_NAME, ChatBarButton);
    },
    stop: () => {
        removeChatBarButton(PLUGIN_NAME);
    },

    risibankPicker,
    hasEmbedPermission,
});
