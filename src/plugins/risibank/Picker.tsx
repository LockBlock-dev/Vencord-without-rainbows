/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { sendMessage } from "@utils/discord";
import { findByPropsLazy } from "@webpack";
import { ComponentDispatch, ExpressionPickerStore, FluxDispatcher, MessageActions, SelectedChannelStore, useCallback, useEffect, useMemo } from "@webpack/common";

import { BASE_API_URI, EXPRESSION_PICKER_VIEW } from "./constants";

const PendingReplyStore = findByPropsLazy("getPendingReply");

/**
 * Represents the RisiBank ExpressionPicker view.
 */
function Picker() {
    /**
     * The iframe URL as a string.
     */
    const iframeURL = useMemo(
        () =>
            `${BASE_API_URI}/embed?${new URLSearchParams({
                theme: "dark",
                allowUsernameSelection: "false",
                showCopyButton: "false",
                mediaSize: "sm",
                navbarSize: "md",
                defaultTab: "hot",
                showNSFW: "false",
            }).toString()}`,
        [BASE_API_URI]
    );

    /**
     * Handles the "message" event and processes the selected sticker.
     * @param {MessageEvent} e - The "message" event object.
     * @returns {void}
     */
    const onSelectSticker = useCallback(
        (e: MessageEvent): void => {
            if (e.origin !== BASE_API_URI) return;

            const {
                data: { type, media },
            } = e;

            if (type !== "risibank-media-selected" || !media) return;

            ExpressionPickerStore.closeExpressionPicker();

            let mediaUrl = media.cache_url;

            if (mediaUrl.includes("full"))
                mediaUrl = mediaUrl.replace("full", "thumb");

            const currentChannelId = SelectedChannelStore.getChannelId();

            const pendingReply =
                PendingReplyStore.getPendingReply(currentChannelId);

            const { allowedMentions, messageReference } =
                MessageActions.getSendMessageOptionsForReply(pendingReply);

            if (pendingReply)
                FluxDispatcher.dispatch({
                    type: "DELETE_PENDING_REPLY",
                    channelId: currentChannelId,
                });

            sendMessage(currentChannelId, { content: mediaUrl }, true, {
                messageReference: messageReference,
                allowedMentions: allowedMentions,
            });

            ComponentDispatch.dispatch("TEXTAREA_FOCUS", null);
        },
        []
    );

    useEffect(() => {
        addEventListener("message", onSelectSticker);

        return () => {
            removeEventListener("message", onSelectSticker);
        };
    }, []);

    return (
        <div
            id={`${EXPRESSION_PICKER_VIEW}-picker-tab-panel`}
            role="tabpanel"
            aria-labelledby={`${EXPRESSION_PICKER_VIEW}-picker-tab`}
        >
            <iframe
                src={iframeURL}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    overflow: "hidden",
                }}
            />
        </div>
    );
}

export default Picker;
