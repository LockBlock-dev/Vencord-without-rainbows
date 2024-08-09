/*
 * Vencord without rainbows, a Discord client mod
 * Copyright (c) 2024 LockBlock-dev and Vencord contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Settings } from "@api/Settings";
import BackupAndRestoreTab from "@components/VencordSettings/BackupAndRestoreTab";
import PatchHelperTab from "@components/VencordSettings/PatchHelperTab";
import PluginsTab from "@components/VencordSettings/PluginsTab";
import ThemesTab from "@components/VencordSettings/ThemesTab";
import UpdaterTab from "@components/VencordSettings/UpdaterTab";
import VencordTab from "@components/VencordSettings/VencordTab";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { i18n, React } from "@webpack/common";

import gitHash from "~git-hash";

type SectionType = "HEADER" | "DIVIDER" | "CUSTOM";
type SectionTypes = Record<SectionType, SectionType>;

export default definePlugin({
    name: "Settings",
    description: "Adds Settings UI and debug info",
    authors: [Devs.Ven, Devs.Megu],
    required: true,

    patches: [
        {
            find: ".versionHash",
            replacement: [
                {
                    match: /\[\(0,\i\.jsxs?\)\((.{1,10}),(\{[^{}}]+\{.{0,20}.versionHash,.+?\})\)," "/,
                    replace: (m, component, props) => {
                        props = props.replace(/children:\[.+\]/, "");
                        return `${m},$self.makeInfoElements(${component}, ${props})`;
                    }
                },
                {
                    match: /copyValue:\i\.join\(" "\)/,
                    replace: "$& + $self.getInfoString()"
                }
            ]
        },
        {
            find: "Messages.ACTIVITY_SETTINGS",
            replacement: [
                {
                    match: /(?<=section:(.{0,50})\.DIVIDER\}\))([,;])(?=.{0,200}(\i)\.push.{0,100}label:(\i)\.header)/,
                    replace: (_, sectionTypes, commaOrSemi, elements, element) => `${commaOrSemi} $self.addSettings(${elements}, ${element}, ${sectionTypes}) ${commaOrSemi}`
                },
                {
                    match: /({(?=.+?function (\i).{0,120}(\i)=\i\.useMemo.{0,30}return \i\.useMemo\(\(\)=>\i\(\3).+?function\(\){return )\2(?=})/,
                    replace: (_, rest, settingsHook) => `${rest}$self.wrapSettingsHook(${settingsHook})`
                }
            ]
        },
        {
            find: "Messages.USER_SETTINGS_ACTIONS_MENU_LABEL",
            replacement: {
                match: /(?<=function\((\i),\i\)\{)(?=let \i=Object.values\(\i.\i\).*?(\i\.\i)\.open\()/,
                replace: "$2.open($1);return;"
            }
        }
    ],

    customSections: [] as ((SectionTypes: SectionTypes) => any)[],

    makeSettingsCategories(SectionTypes: SectionTypes) {
        return [
            {
                section: SectionTypes.HEADER,
                label: "Vencord",
                className: "vc-settings-header"
            },
            {
                section: "VencordSettings",
                label: "Vencord",
                element: VencordTab,
                className: "vc-settings"
            },
            {
                section: "VencordPlugins",
                label: "Plugins",
                element: PluginsTab,
                className: "vc-plugins"
            },
            {
                section: "VencordThemes",
                label: "Themes",
                element: ThemesTab,
                className: "vc-themes"
            },
            !IS_UPDATER_DISABLED && {
                section: "VencordUpdater",
                label: "Updater",
                element: UpdaterTab,
                className: "vc-updater"
            },
            {
                section: "VencordSettingsSync",
                label: "Backup & Restore",
                element: BackupAndRestoreTab,
                className: "vc-backup-restore"
            },
            IS_DEV && {
                section: "VencordPatchHelper",
                label: "Patch Helper",
                element: PatchHelperTab,
                className: "vc-patch-helper"
            },
            ...this.customSections.map(func => func(SectionTypes)),
            {
                section: SectionTypes.DIVIDER
            }
        ].filter(Boolean);
    },

    isRightSpot({ header, settings }: { header?: string; settings?: string[]; }) {
        const firstChild = settings?.[0];
        // lowest two elements... sanity backup
        if (firstChild === "LOGOUT" || firstChild === "SOCIAL_LINKS") return true;

        const { settingsLocation } = Settings.plugins.Settings;

        if (settingsLocation === "bottom") return firstChild === "LOGOUT";
        if (settingsLocation === "belowActivity") return firstChild === "CHANGELOG";

        if (!header) return;

        const names = {
            top: i18n.Messages.USER_SETTINGS,
            aboveNitro: i18n.Messages.BILLING_SETTINGS,
            belowNitro: i18n.Messages.APP_SETTINGS,
            aboveActivity: i18n.Messages.ACTIVITY_SETTINGS
        };
        return header === names[settingsLocation];
    },

    patchedSettings: new WeakSet(),

    addSettings(elements: any[], element: { header?: string; settings: string[]; }, sectionTypes: SectionTypes) {
        if (this.patchedSettings.has(elements) || !this.isRightSpot(element)) return;

        this.patchedSettings.add(elements);

        elements.push(...this.makeSettingsCategories(sectionTypes));
    },

    wrapSettingsHook(originalHook: (...args: any[]) => Record<string, unknown>[]) {
        return (...args: any[]) => {
            const elements = originalHook(...args);
            if (!this.patchedSettings.has(elements))
                elements.unshift(...this.makeSettingsCategories({
                    HEADER: "HEADER",
                    DIVIDER: "DIVIDER",
                    CUSTOM: "CUSTOM"
                }));

            return elements;
        };
    },

    options: {
        settingsLocation: {
            type: OptionType.SELECT,
            description: "Where to put the Vencord settings section",
            options: [
                { label: "At the very top", value: "top" },
                { label: "Above the Nitro section", value: "aboveNitro", default: true },
                { label: "Below the Nitro section", value: "belowNitro" },
                { label: "Above Activity Settings", value: "aboveActivity" },
                { label: "Below Activity Settings", value: "belowActivity" },
                { label: "At the very bottom", value: "bottom" },
            ]
        },
    },

    get electronVersion() {
        return VencordNative.native.getVersions().electron || window.armcord?.electron || null;
    },

    get chromiumVersion() {
        try {
            return VencordNative.native.getVersions().chrome
                // @ts-ignore Typescript will add userAgentData IMMEDIATELY
                || navigator.userAgentData?.brands?.find(b => b.brand === "Chromium" || b.brand === "Google Chrome")?.version
                || null;
        } catch { // inb4 some stupid browser throws unsupported error for navigator.userAgentData, it's only in chromium
            return null;
        }
    },

    get additionalInfo() {
        if (IS_DEV) return " (Dev)";
        if (IS_WEB) return " (Web)";
        if (IS_VESKTOP) return ` (Vesktop v${VesktopNative.app.getVersion()})`;
        if (IS_STANDALONE) return " (Standalone)";
        return "";
    },

    getInfoRows() {
        const { electronVersion, chromiumVersion, additionalInfo } = this;

        const rows = [`Vencord ${gitHash}${additionalInfo}`];

        if (electronVersion) rows.push(`Electron ${electronVersion}`);
        if (chromiumVersion) rows.push(`Chromium ${chromiumVersion}`);

        return rows;
    },

    getInfoString() {
        return "\n" + this.getInfoRows().join("\n");
    },

    makeInfoElements(Component: React.ComponentType<React.PropsWithChildren>, props: React.PropsWithChildren) {
        return this.getInfoRows().map((text, i) =>
            <Component key={i} {...props}>{text}</Component>
        );
    }
});
