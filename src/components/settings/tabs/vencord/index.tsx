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
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { Paragraph } from "@components/Paragraph";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import NoTrack from "@plugins/_core/noTrack";
import SettingsPlugin from "@plugins/_core/settings";
import { gitRemote } from "@shared/vencordUserAgent";
import { IS_WINDOWS } from "@utils/constants";
import { Margins } from "@utils/margins";
import { relaunch } from "@utils/native";
import { promptToRestart } from "@utils/promptToRestart";
import { React } from "@webpack/common";

import { MacOSVibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";
import { WindowsMaterialSettings } from "./WindowsMaterialSettings";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function Switches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "nativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);
    const { disableAnalytics } = NoTrack.settings.use(["disableAnalytics"]);

    const Switches = [
        {
            key: "useQuickCss",
            title: "Enable Custom CSS",
            description: "Apply your configured QuickCSS"
        },
        {
            value: disableAnalytics,
            updateSetting(newValue) {
                NoTrack.settings.store.disableAnalytics = newValue;
            },
            reactKey: "NoTrack::disableAnalytics",
            key: null!,
            title: "Block Discord Analytics",
            description: NoTrack.settings.def.disableAnalytics.description,
            restartRequired: NoTrack.settings.def.disableAnalytics.restartNeeded,
        },
        IS_DISCORD_DESKTOP && {
            key: "nativeTitleBar",
            title: "Enable the system's title bar in addition to Discord's custom one",
            restartRequired: true
        },
        !IS_WEB && {
            key: "transparent",
            title: "Enable window transparency",
            description: "A theme that supports transparency is required or this will do nothing. Stops the window from being resizable as a side effect",
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: "Disable minimum window size",
            description: "Allows you to resize the window to any size, even smaller than Discord's minimum size",
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
            restartRequired: true
        },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: "Enable React Developer Tools",
            description: "Mainly useful for plugin developers. Ignore this if you don't know what it is",
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        reactKey?: string;
        title: string;
        description?: string;
        restartRequired?: boolean;
        updateSetting?(newValue: boolean): void;
        value?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) {
            return null;
        }

        const { reactKey, key, value, title, description, restartRequired, updateSetting = v => (settings[key] = v) } = setting;

        return (
            <FormSwitch
                key={reactKey ?? key}
                title={title}
                description={description}
                value={value ?? settings[key]}
                hideBorder
                onChange={v => {
                    updateSetting(v);

                    if (restartRequired) {
                        promptToRestart("relaunch");
                    }
                }}
            />
        );
    });
}

function VencordSettings() {
    return (
        <SettingsTab>
            <section>
                <Heading className={Margins.bottom8}>Quick Actions</Heading>

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
            </section>

            <Divider />

            <section className={Margins.top16}>
                <Heading className={Margins.bottom8}>Settings</Heading>
                <Paragraph className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    Hint: You can change the position of this settings section in the{" "}
                    <a onClick={() => openPluginModal(SettingsPlugin)}>
                        settings of the Settings plugin
                    </a>!
                </Paragraph>

                <div className="vc-settings-switches">
                    <Switches />
                </div>
            </section>


            <MacOSVibrancySettings />
            <WindowsMaterialSettings />

            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "Vencord Settings");
