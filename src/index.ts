import Logger, { LogLevel } from "./util/logger.ts";
Logger.log(LogLevel.Info, "Starting...");

let version = "0.0.0";
try {
    const pkg = JSON.parse(
        await Deno.readTextFile("package.json")
    );
    version = pkg?.version ?? version;
}
catch (e) {
    Logger.log(LogLevel.Warn, "Could not read package.json:", String(e));
};
Logger.log(LogLevel.Info, "Version:", version);

// Integrations
import * as Integrations from "../integrations/index.ts";
import Changelog, { ArticleData } from "./changelog.ts";


// Platforms
import { Platform } from "./platforms/common.ts";
import Dedicated from "./platforms/dedicated.ts";
import WindowsUWP from "./platforms/windows-uwp.ts";
import WindowsGDK from "./platforms/windows-gdk.ts";
import Xbox from "./platforms/xbox.ts";
import iOS from "./platforms/ios.ts";
import Android from "./platforms/android.ts";

export const Platforms: Platform[] = [];
Platforms.push(new Dedicated, new Dedicated(true));
Platforms.push(new WindowsUWP, new WindowsUWP(true));
Platforms.push(new WindowsGDK, new WindowsGDK(true));
Platforms.push(new Xbox, new Xbox(true));
Platforms.push(new iOS, new Android); // Mobile Platforms

// Platform loop
async function platformLoop(isPreview: boolean, data: ArticleData, releaseTime = Date.now()) {
    const startTime = Number(releaseTime);
    while (true) {
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

        const allPlatformsDone = Platforms
            .filter((platform) => platform.fetchPreview === isPreview) // Relevant Platforms
            .every((platform) => platform.latestVersion.encode() === data.version.encode());

        const timeSinceRelease = Date.now() - startTime;
        if (true === allPlatformsDone || timeSinceRelease > 24 * 60 * 60 * 1000) {
            Logger.log(LogLevel.Debug, data.version.toString(), "-", "All platforms done!");
            Integrations.emitAllPlatformsDone(isPreview, data);
            return;
        };

        await new Promise((resolve) => setTimeout(resolve, 15000)); // Sleep for 15 seconds
    };
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
        setTimeout(() => {
            try {
                platformLoop(isPreview, data);
            } catch {};
        }, 5 * 1000);
    }).catch((error) => Logger.log(LogLevel.Error, error));
};

setTimeout(loop, 7500); // Add some delay before starting. Allows for almost instant fetching as soon as bot starts.
setInterval(loop, 30000);


import XboxApp from "./platforms/xbox-app.ts";
async function updateTokens() {
    if (await XboxApp.refreshTokens() !== void 0) {
        setInterval(XboxApp.refreshTokens, 4 * 60 * 60 * 1000); // Run every 4 hours
    };
};

updateTokens();