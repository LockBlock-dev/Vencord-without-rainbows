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
    name: "RisiBank",
    description: "Brings RisiBank to the Discord client",
    version: "1.1.0",
    authors: [{
        name: "LockBlock",
        id: 926900384000249867n
    }],
    dependencies: ["ChatInputButtonAPI"],
    patches: [{
        find: "#{intl::EXPRESSION_PICKER_GIF}",
        replacement: {
            match: /(role:"tablist","aria-label":\i\.\i\.string\(\i\.\i#{intl::EXPRESSION_PICKER_CATEGORIES_A11Y_LABEL}\),children:\[)(\i\?(\(0,\i\.jsx\))\((\i),{.*?isActive:(\i)===.*?children:\i\.\i\.string\(\i\.\i#{intl::EXPRESSION_PICKER_GIF}\)}\):null.*?\))(\]}\)}\):null,)(\i===.*?\.STICKER&&\i\?\(0,\i\.jsx\)\(.*?(\{.*?,onSelectSticker:.*?\})\):null)/,
            replace: (_, start, navlistRest, jsx, tabHeaderComp, currentTab, end, shouldShowStickerView, expressionPickerProps) => {
                const isActive = `${currentTab}==="${EXPRESSION_PICKER_VIEW}"`;

                return (
                    start +
                    "$self.hasEmbedPermission()?" +
                    `${jsx}(${tabHeaderComp},{` +
                    `id:"${EXPRESSION_PICKER_VIEW}-picker-tab",` +
                    `"aria-controls":"${EXPRESSION_PICKER_VIEW}-picker-tab-panel",` +
                    `"aria-selected":${isActive},` +
                    `isActive:${isActive},` +
                    `viewType:"${EXPRESSION_PICKER_VIEW}",` +
                    `children:${jsx}("div",{children:"${PLUGIN_NAME}"})` +
                    "})" +
                    `:null,${navlistRest}` +
                    end +
                    `${currentTab}==="${EXPRESSION_PICKER_VIEW}"?${jsx}($self.risibankPicker,${expressionPickerProps}):null,${shouldShowStickerView}`
                );
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
