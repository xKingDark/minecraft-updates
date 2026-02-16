import { ArticleData } from "../../../src/changelog.ts";
import Mastodon from "../index.ts";

export async function buildChangelogStatus(
    masto: Mastodon,
    isPreview: boolean,
    isHotfix: boolean,
    data: ArticleData
) {
    const emoji =
        isPreview ? "🍌"
        : isHotfix ? "🌶"
        : "🍋‍🟩";

    const type =
        isPreview ? "Preview"
        : isHotfix ? "Hotfix"
        : "Stable release";

    const status =
        `${emoji} New Minecraft: Bedrock Edition ${type}: **${data.version}**\n\n${data.article.url}\n\n#MinecraftBedrockUpdates`;

    const mediaIds: string[] = [];
    if (typeof data.thumbnail === "string") {
        const image = await fetch(data.thumbnail);
        const attachment = await masto.CLIENT.v2.media.create({
            file: await image.blob(),
            description: ""
        });

        mediaIds.push(attachment.id);
    };

    return { status, mediaIds };
};