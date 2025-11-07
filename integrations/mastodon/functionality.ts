import { mastodon } from "masto";
import { ArticleData } from "../../src/changelog.ts";
import { Platform } from "../../src/platforms/common.ts";
import Dedicated from "../../src/platforms/dedicated.ts";
import Mastodon from "./index.ts";

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
        const attachment = await masto.client.v2.media.create({
            file: await image.blob(),
            description: ""
        });

        mediaIds.push(attachment.id);
    };

    return masto.client.v1.statuses.create({
        visibility: "public",
        status,
        mediaIds
    });
};

async function platformRelease(masto: Mastodon, status: mastodon.v1.Status, platform: Platform) {
    await masto.client.v1.statuses.create({
        inReplyToId: status.id,
        status: platform.message
    });
};

export async function newChangelog(
    masto: Mastodon,
    isPreview: boolean, isHotfix: boolean,
    data: ArticleData
) {
    const status = postChangelog(masto, isPreview, isHotfix, data);

    // Platform Release
    const platformListener = async (platform: Platform) => {
        const post = await status;
        if (post == void 0) {
            masto.off("platformRelease", platformListener);
            return;
        };

        if (isPreview !== platform.fetchPreview
            || data.version.encode() !== platform.latestVersion.encode())
            return;

        platformRelease(masto, post, platform);
        masto.off("platformRelease", platformListener);
    };
    masto.on("platformRelease", platformListener);

    const allDone = (mcPreview: boolean, articleData: ArticleData) => {
        if (isPreview !== mcPreview
            || data.version.encode() !== articleData.version.encode())
            return;

        masto.off("platformRelease", platformListener);
        masto.off("allPlatformsDone", allDone);
    };
    masto.on("allPlatformsDone", allDone);
};