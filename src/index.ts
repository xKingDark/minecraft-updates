import fs from "node:fs";

import Logger, { LogLevel } from "./util/logger.ts";
Logger.log(LogLevel.Info, "Starting...");

const { version } = JSON.parse(fs.readFileSync("package.json").toString());
Logger.log(LogLevel.Info, "Version:", version);

// Integrations
import * as Integrations from "../integrations/index.ts";
import Changelog, { ArticleData } from "./changelog.ts";


// Platforms
import { Platform } from "./platforms/common.ts";
import Dedicated from "./platforms/dedicated.ts";
import Windows from "./platforms/windows.ts";
import iOS from "./platforms/ios.ts";
import Android from "./platforms/android.ts";

export const Platforms: Platform[] = [];
Platforms.push(new Dedicated, new Dedicated(true));
Platforms.push(new Windows, new Windows(true));
Platforms.push(new iOS);
Platforms.push(new Android);

// Platform loop
async function platformLoop(isPreview: boolean, data: ArticleData, releaseTime = Date.now()) {
    for (const platform of Platforms) {
        if (isPreview !== platform.fetchPreview
            || data.version.encode() === platform.latestVersion.encode())
            continue;

        const version = await platform.fetchLatestVersion();
        if (data.version.encode() !== version.encode())
            continue;

        Logger.log(LogLevel.Debug, "New platform release:", platform.name, "- version:", version.toString());
        Integrations.emitPlatformRelease(platform);
    };

    const allDone = Platforms
        .filter((platform) => platform.fetchPreview === isPreview)
        .every((platform) => platform.latestVersion.encode() === data.version.encode());

    const timeSinceRelease = new Date().getTime() - new Date(releaseTime).getTime();
    if (true === allDone || timeSinceRelease > 24 * 60 * 60) {
        Logger.log(LogLevel.Debug, data.version.toString(), "-", "All platforms done!");
        Integrations.emitAllPlatformsDone(isPreview, data);
        return;
    };

    await new Promise((resolve) => setTimeout(resolve, 15000)); // Sleep for 15 seconds
    platformLoop(isPreview, data, releaseTime);
};


// Changelog loop
function loop() {
    Changelog.fetchLatestChangelog((isPreview, data) => {
        if (true === isPreview) {
            const preview = Changelog.getLatestSavedVersion(true).encode();
            if (preview === data.version.encode())
                return;

            Integrations.emitChangelog(isPreview, false, data);
        }
        else {
            const stable = Changelog.getLatestSavedVersion(false).encode();
            if (stable === data.version.encode())
                return;

            const isHotfix = data.version.patch > Math.floor(data.version.patch / 10) * 10;
            Integrations.emitChangelog(isPreview, isHotfix, data);
        };

        Logger.log(LogLevel.Debug, "New release post:", data.article.title);

        Changelog.saveArticle(isPreview, data);
        platformLoop(isPreview, data);
    }).catch(console.error);
};

setTimeout(loop, 7500);
setInterval(loop, 60000);