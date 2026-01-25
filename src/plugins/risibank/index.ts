/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { addChatBarButton, removeChatBarButton } from "@api/ChatButtons";
import definePlugin from "@utils/types";

import { RisiBankButton as ChatBarButton, RisiBankIcon } from "./Button";
import { COMPONENT_INSTANCE_VARIABLE_NAME, EXPRESSION_PICKER_VIEW, PLUGIN_NAME } from "./constants";
import risibankPicker from "./Picker";
import { hasEmbedPermission } from "./utils";

export default definePlugin({
    name: "RisiBank",
    description: "Brings RisiBank to the Discord client",
    version: "1.2.0",
    authors: [{
        name: "LockBlock",
        id: 926900384000249867n
    }],
    dependencies: ["ChatInputButtonAPI"],
    patches: [
        {
            find: "#{intl::EXPRESSION_PICKER_GIF}",
            replacement: {
                match: /}\):null,((\i)===.*?\.STICKER&&\i)\?(\(0,\i\.jsx\))(\(.*?(\{.*?,onSelectSticker:.*?\})\):null)/,
                replace: (_, shouldShowStickerView, currentTab, jsx, stickerView, expressionPickerProps) => {
                    return (
                        "}):null," +
                        `${currentTab}==="${EXPRESSION_PICKER_VIEW}"?${jsx}($self.risibankPicker,${expressionPickerProps}):null,` +
                        shouldShowStickerView + "?" + jsx + stickerView
                    );
                }
            }
        },
        {
            find: "#{intl::EXPRESSION_PICKER_GIF}",
            replacement: {
                match: /(\i=\i\?)((\(0,\i\.jsx\))\((\i),{.*?isActive:(\i)===.*?children:.*?}\)}\):null)/,
                replace: (_, startGifTernary, gifNav, jsx, tabHeaderComponent, currentTab) => {
                    const isActive = `${currentTab}==="${EXPRESSION_PICKER_VIEW}"`;

                    return (
                        `${COMPONENT_INSTANCE_VARIABLE_NAME}=$self.hasEmbedPermission()?` +
                        `${jsx}(${tabHeaderComponent},{` +
                        `id:"${EXPRESSION_PICKER_VIEW}-picker-tab",` +
                        `"aria-controls":"${EXPRESSION_PICKER_VIEW}-picker-tab-panel",` +
                        `"aria-selected":${isActive},` +
                        `isActive:${isActive},` +
                        `viewType:"${EXPRESSION_PICKER_VIEW}",` +
                        `children:${jsx}("div",{children:"${PLUGIN_NAME}"})` +
                        "}):null," +
                        startGifTernary +
                        gifNav
                    );
                }
            }
        },
        {
            find: "#{intl::EXPRESSION_PICKER_GIF}",
            replacement: {
                match: /(role:"tablist","aria-label":\i\.\i\.string\(\i\.\i#{intl::EXPRESSION_PICKER_CATEGORIES_A11Y_LABEL}\),children:\[)(\i)\?/,
                replace: (_, start, condition) => {
                    return start + `${COMPONENT_INSTANCE_VARIABLE_NAME},` + `${condition} ?`;
                }
            }
        }],

    start: () => {
        addChatBarButton(PLUGIN_NAME, ChatBarButton, RisiBankIcon);
    },
    stop: () => {
        removeChatBarButton(PLUGIN_NAME);
    },

    risibankPicker,
    hasEmbedPermission,
});
