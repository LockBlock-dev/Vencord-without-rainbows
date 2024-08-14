/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getCurrentChannel } from "@utils/discord";
import { ChannelStore, PermissionsBits, PermissionStore } from "@webpack/common";
import { Channel, User } from "discord-types/general";

/**
 * Computes a permission for an user in a channel.
 * @param {bigint} permission - The permission flag to check.
 * @param {Channel} channel - The channel in which the permission is checked. Defaults to the current channel.
 * @param {User} [user] - The user for whom the permission is checked. Defaults to the current user.
 * @returns {boolean} Returns `true` if the user has the specified permission in the channel context, otherwise `false`.
 */
export const checkPermission = (
    permission: bigint,
    channel: Channel = getCurrentChannel(),
    user?: User
): boolean => {
    return PermissionStore.can(permission, channel, user);
};

/**
 * Checks if the current user has the EMBED_LINKS permission in the specified channel.
 * @param {string} [channelId] - The channel id for which the permission is checked. Defaults to the current channel.
 * @returns {boolean} Returns `true` if the current user has the specified permission in the channel context, otherwise `false`.
 */
export const hasEmbedPermission = (channelId: string = getCurrentChannel().id): boolean => {
    const channel = ChannelStore.getChannel(channelId);

    if (!channel || channel.isPrivate()) return true;

    return checkPermission(PermissionsBits.EMBED_LINKS, channel);
};
