import {
    TextDisplayBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "npm:discord.js";

import { Platform } from "../../../src/platforms/common.ts";
import Dedicated from "../../../src/platforms/dedicated.ts";

export function buildPlatformComponents(platform: Platform) {
    const button = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(platform.download)
        .setLabel(
            platform.name === Dedicated.platform
                ? "Download Bedrock Dedicated Server"
                : `Open on ${platform.name}`
        );

    return [
        new TextDisplayBuilder().setContent(platform.message),
        platform.directLink ? void 0 : button,
        
        platform.directLink
    ];
};