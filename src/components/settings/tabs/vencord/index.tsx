/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/index";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { gitRemote } from "@shared/vencordUserAgent";
import { IS_MAC, IS_WINDOWS } from "@utils/constants";
import { Margins } from "@utils/margins";
import { relaunch } from "@utils/native";
import { Forms, React, Switch, UserStore } from "@webpack/common";

import { VibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function Switches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "winNativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);

    const Switches = [
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
        !IS_WEB && (!IS_DISCORD_DESKTOP || !IS_WINDOWS ? {
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
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
            note: "Requires a full restart"
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: "Disable minimum window size",
            note: "Requires a full restart"
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        note: string;
    }>;

    return Switches.map(s => s && (
        <Switch
            key={s.key}
            value={settings[s.key]}
            onChange={v => settings[s.key] = v}
            note={s.note}
        >
            {s.title}
        </Switch>
    ));
}

function VencordSettings() {
    const needsVibrancySettings = IS_DISCORD_DESKTOP && IS_MAC;

    const user = UserStore.getCurrentUser();

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
                        <>
                            <QuickAction
                                Icon={RestartIcon}
                                text="Relaunch Discord"
                                action={relaunch}
                            />
                            <QuickAction
                                Icon={FolderIcon}
                                text="Open Settings Folder"
                                action={() => VencordNative.settings.openFolder()}
                            />
                        </>
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
                    Hint: You can change the position of this settings section in the{" "}
                    <a onClick={() => openPluginModal(Vencord.Plugins.plugins.Settings)}>
                        settings of the Settings plugin
                    </a>!
                </Forms.FormText>

                <Switches />
            </Forms.FormSection>


            {needsVibrancySettings && <VibrancySettings />}

            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "Vencord Settings");
