import Logger, { LogLevel } from "./util/logger.ts";
Logger.log(LogLevel.Info, "Starting...");

// Integrations
import { Integration } from "../integrations/integration.ts";
import { Events } from "../integrations/events.ts";
await Integration.createAll("./integrations");

// Platforms
import { Platform } from "./platforms/common.ts";
await Platform.createAll();

// Platform loop
async function platformLoop(isPreview: boolean, data: ArticleData, releaseTime = Date.now()) {
    const startTime = Number(releaseTime);
    while (true) {
        for (const platform of Platform.getInstances()) {
            if (isPreview !== platform.fetchPreview
                || data.version.encode() === platform.latestVersion.encode())
                continue;

            const version = await platform.fetchLatestVersion();
            if (data.version.encode() !== version.encode())
                continue;

            Integration.emit(Events.NewRelease, platform);
            Logger.log(LogLevel.Debug, "New platform release:", platform.name, "- version:", version.toString());
        };

        const allPlatformsDone = Platform.getInstances()
            .filter((platform) => platform.fetchPreview === isPreview) // Relevant Platforms
            .every((platform) => platform.latestVersion.encode() === data.version.encode());

        const timeSinceRelease = Date.now() - startTime;
        if (true === allPlatformsDone || timeSinceRelease > 24 * 60 * 60 * 1000) {
            Integration.emit(Events.AllDone, isPreview, data);

            Logger.log(LogLevel.Debug, data.version.toString(), "-", "All platforms done!");
            return;
        };

        await new Promise((resolve) => setTimeout(resolve, 15000)); // Sleep for 15 seconds
    };
};


// Changelog loop
import Changelog, { ArticleData } from "./changelog.ts";

function loop() {
    Changelog.fetchLatestChangelog((isPreview, data) => {
        const stable = Changelog.getLatestSavedVersion(isPreview).encode();
        if (stable === data.version.encode())
            return;

        const isHotfix = data.version.patch > Math.floor(data.version.patch / 10) * 10;

        Integration.emit(Events.NewChangelog, isPreview, !isPreview && isHotfix, data);
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
setInterval(loop, 60000);


import XboxApp from "./platforms/xbox-app.ts";
async function updateTokens() {
    if (await XboxApp.refreshTokens() !== void 0) {
        setInterval(XboxApp.refreshTokens, 4 * 60 * 60 * 1000); // Run every 4 hours
    };
};

updateTokens();