import { mastodon } from "masto";
import Mastodon from "./index.ts";

import { ArticleData } from "../../src/changelog.ts";
import { Platform } from "../../src/platforms/common.ts";
import { Events } from "../events.ts";

async function postChangelog(
    masto: Mastodon,
    isPreview: boolean, isHotfix: boolean,
    data: ArticleData
) {
    const emoji = isPreview ? "🍌" : (isHotfix ? "🌶" : "🍋‍🟩");
    const type = isPreview ? "Preview" : (isHotfix ? "Hotfix" : "Stable release");
    const status = `${emoji} New Minecraft: Bedrock Edition ${type}: **${data.version}**\n\n${data.article.url}\n\n#MinecraftBedrockUpdates`;

    const mediaIds: string[] = [];
    if (typeof data.thumbnail === "string") {
        const image = await fetch(data.thumbnail);
        const attachment = await masto.CLIENT.v2.media.create({
            file: await image.blob(),
            description: ""
        });

        mediaIds.push(attachment.id);
    };

    return masto.CLIENT.v1.statuses.create({
        visibility: "public",
        status,
        mediaIds
    });
};

async function platformRelease(masto: Mastodon, status: mastodon.v1.Status, platform: Platform) {
    await masto.CLIENT.v1.statuses.create({
        inReplyToId: status.id,
        status: platform.message
    });
};

export async function onNewChangelog(
    masto: Mastodon,
    isPreview: boolean, isHotfix: boolean,
    data: ArticleData
) {
    const status = postChangelog(masto, isPreview, isHotfix, data);

    // Platform Release
    const platformListener = async (platform: Platform) => {
        const post = await status;
        if (post == void 0) {
            masto.off(Events.NewRelease, platformListener);
            return;
        };

        if (isPreview !== platform.fetchPreview
            || data.version.encode() !== platform.latestVersion.encode())
            return;

        platformRelease(masto, post, platform);
        masto.off(Events.NewRelease, platformListener);
    };
    masto.on(Events.NewRelease, platformListener);

    const allDone = (mcPreview: boolean, articleData: ArticleData) => {
        if (isPreview !== mcPreview
            || data.version.encode() !== articleData.version.encode())
            return;

        masto.off(Events.NewRelease, platformListener);
        masto.off(Events.AllDone, allDone);
    };
    masto.on(Events.AllDone, allDone);
};