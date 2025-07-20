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

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { openPluginModal } from "@components/PluginSettings/PluginModal";
import { gitRemote } from "@shared/vencordUserAgent";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { relaunch } from "@utils/native";
import { Button, Forms, React, Select, Switch, UserStore } from "@webpack/common";

import { Flex, FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "..";
import { openNotificationSettingsModal } from "./NotificationSettings";
import { QuickAction, QuickActionCard } from "./quickActions";
import { SettingsTab, wrapTab } from "./shared";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function VencordSettings() {
    const settings = useSettings();

    const isWindows = navigator.platform.toLowerCase().startsWith("win");
    const isMac = navigator.platform.toLowerCase().startsWith("mac");
    const needsVibrancySettings = IS_DISCORD_DESKTOP && isMac;

    const user = UserStore.getCurrentUser();

    const Switches: Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        note: string;
    }> =
        [
            {
                key: "useQuickCss",
                title: "Enable Custom CSS",
                note: "Loads your Custom CSS"
            },
            !IS_WEB && {
                key: "enableReactDevtools",
                title: "Enable React Developer Tools",
                note: "Requires a full restart"
            },
            !IS_WEB && (!IS_DISCORD_DESKTOP || !isWindows ? {
                key: "frameless",
                title: "Disable the window frame",
                note: "Requires a full restart"
            } : {
                key: "winNativeTitleBar",
                title: "Use Windows' native title bar instead of Discord's custom one",
                note: "Requires a full restart"
            }),
            !IS_WEB && {
                key: "transparent",
                title: "Enable window transparency.",
                note: "You need a theme that supports transparency or this will do nothing. WILL STOP THE WINDOW FROM BEING RESIZABLE!! Requires a full restart"
            },
            !IS_WEB && isWindows && {
                key: "winCtrlQ",
                title: "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
                note: "Requires a full restart"
            },
            IS_DISCORD_DESKTOP && {
                key: "disableMinSize",
                title: "Disable minimum window size",
                note: "Requires a full restart"
            },
        ];

    return (
        <SettingsTab title="Vencord Settings">
            <Forms.FormSection title="Quick Actions">
                <QuickActionCard>
                    <QuickAction
                        Icon={LogIcon}
                        text="Notification Log"
                        action={openNotificationLogModal}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text="Edit QuickCSS"
                        action={() => VencordNative.quickCss.openEditor()}
                    />
                    {!IS_WEB && (
                        <QuickAction
                            Icon={RestartIcon}
                            text="Relaunch Discord"
                            action={relaunch}
                        />
                    )}
                    {!IS_WEB && (
                        <QuickAction
                            Icon={FolderIcon}
                            text="Open Settings Folder"
                            action={() => VencordNative.settings.openFolder()}
                        />
                    )}
                    <QuickAction
                        Icon={GithubIcon}
                        text="View Source Code"
                        action={() => VencordNative.native.openExternal("https://github.com/" + gitRemote)}
                    />
                </QuickActionCard>
            </Forms.FormSection>

            <Forms.FormDivider />

            <Forms.FormSection className={Margins.top16} title="Settings" tag="h5">
                <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    Hint: You can change the position of this settings section in the
                    {" "}<Button
                        look={Button.Looks.BLANK}
                        style={{ color: "var(--text-link)", display: "inline-block" }}
                        onClick={() => openPluginModal(Vencord.Plugins.plugins.Settings)}
                    >
                        settings of the Settings plugin
                    </Button>!
                </Forms.FormText>

                {Switches.map(s => s && (
                    <Switch
                        key={s.key}
                        value={settings[s.key]}
                        onChange={v => settings[s.key] = v}
                        note={s.note}
                    >
                        {s.title}
                    </Switch>
                ))}
            </Forms.FormSection>


            {needsVibrancySettings && <>
                <Forms.FormTitle tag="h5">Window vibrancy style (requires restart)</Forms.FormTitle>
                <Select
                    className={Margins.bottom20}
                    placeholder="Window vibrancy style"
                    options={[
                        // Sorted from most opaque to most transparent
                        {
                            label: "No vibrancy", value: undefined
                        },
                        {
                            label: "Under Page (window tinting)",
                            value: "under-page"
                        },
                        {
                            label: "Content",
                            value: "content"
                        },
                        {
                            label: "Window",
                            value: "window"
                        },
                        {
                            label: "Selection",
                            value: "selection"
                        },
                        {
                            label: "Titlebar",
                            value: "titlebar"
                        },
                        {
                            label: "Header",
                            value: "header"
                        },
                        {
                            label: "Sidebar",
                            value: "sidebar"
                        },
                        {
                            label: "Tooltip",
                            value: "tooltip"
                        },
                        {
                            label: "Menu",
                            value: "menu"
                        },
                        {
                            label: "Popover",
                            value: "popover"
                        },
                        {
                            label: "Fullscreen UI (transparent but slightly muted)",
                            value: "fullscreen-ui"
                        },
                        {
                            label: "HUD (Most transparent)",
                            value: "hud"
                        },
                    ]}
                    select={v => settings.macosVibrancyStyle = v}
                    isSelected={v => settings.macosVibrancyStyle === v}
                    serialize={identity} />
            </>}

            <Forms.FormSection className={Margins.top16} title="Vencord Notifications" tag="h5">
                <Flex>
                    <Button onClick={openNotificationSettingsModal}>
                        Notification Settings
                    </Button>
                    <Button onClick={openNotificationLogModal}>
                        View Notification Log
                    </Button>
                </Flex>
            </Forms.FormSection>
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "Vencord Settings");
