import fs from "node:fs";
const isDev = process.argv.includes("--dev");

import { ArticleData } from "../../src/changelog.ts";
import { Platform } from "../../src/platforms/common.ts";
import Dedicated from "../../src/platforms/dedicated.ts";
import Discord from "./index.ts";

const config = JSON.parse(
    await Deno.readTextFile(
        isDev ? "integrations/discord/data/config-test.json"
        : "integrations/discord/data/config.json"
    )
);

import {
    ChannelType,
    ForumThreadChannel,
    Message,
    MessageFlags,

    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorSpacingSize,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} from "npm:discord.js";
import TimedPayloadQueue from "./util/timed-payload-queue.ts";
async function postChangelog(
    discord: Discord,
    isPreview: boolean, isHotfix: boolean,
    data: ArticleData
) {
    const channel = discord.client.channels.cache.get(config.channel);
    if (channel == void 0 || channel.type !== ChannelType.GuildForum)
        return;

    const emoji = isPreview ? "🍌️" : (isHotfix ? "🌶️" : "🍋‍🟩️");
    const type = isPreview ? "Preview" : (isHotfix ? "Hotfix" : "Stable");

    const threads = channel.threads;

    const container = new ContainerBuilder();
    container.setAccentColor(
        isPreview ? 0xFFCC00
        : (isHotfix ? 0xDA2F47 : 0x46FF27),
    );
        
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
        .setContent(`## ${emoji} ${data.article.title}`)
    );
    
    const description = new TextDisplayBuilder().setContent(
        (isPreview
            ? [
                "It's that day of the week!",
                "A new Preview release for Minecraft: Bedrock Edition is out now!"
            ]
            : [
                isHotfix
                ? "A new spicy stable release for Minecraft: Bedrock Edition is out now!"
                : "A new stable release for Minecraft: Bedrock Edition is out now!"
            ]
        ).join("\n"),
    );
    
    container.addTextDisplayComponents(description);
    
    if (typeof data.thumbnail === "string") {
        const media = new MediaGalleryBuilder();
        media.addItems(
            new MediaGalleryItemBuilder()
                .setDescription(data.article.title)
                .setURL(data.thumbnail),
        );
        container.addMediaGalleryComponents(media);
    };
    
    container.addSeparatorComponents((separator) =>
        separator.setSpacing(SeparatorSpacingSize.Small));
        
    const date = Math.floor(
        new Date(data.article.updated_at).getTime() / 1000
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
        .setContent(`-# Posted <t:${date}:R> — <t:${date}:F>`),
    );
    
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents([
        new ButtonBuilder()
            .setLabel("Link")
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311574423609416", name: "changelog" })
            .setURL(data.article.url),
        new ButtonBuilder()
            .setLabel("Feedback")
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311572024463380", name: "feedback" })
            .setURL("https://feedback.minecraft.net/"),
    ]);

    const post = await threads.create({
        name: `${emoji} ${type} ${data.version}`,
        appliedTags: [
            isPreview ? config.tags.preview : config.tags.stable
        ],
        message: {
            flags: MessageFlags.IsComponentsV2,
            components: [ container, row ],
        },
    });

    const message = await post.fetchStarterMessage();
    if (message == void 0)
        return post;

    try {
        await message.react(emoji);
        await message.pin();
    }
    catch {};

    return post;
};

function platformRelease(post: ForumThreadChannel, platform: Platform) {
    return [
        new TextDisplayBuilder().setContent(platform.message),
        new ButtonBuilder()
            .setLabel(platform.name === Dedicated.platform
                ? "Download Bedrock Dedicated Server"
                : "Open on ".concat(platform.name)
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311574423609416", name: "changelog" })
            .setURL(platform.download),
        platform.directLink
    ];
};

export async function newChangelog(
    discord: Discord,
    isPreview: boolean, isHotfix: boolean,
    data: ArticleData
) {
    const channel = postChangelog(discord, isPreview, isHotfix, data);
    const payloadQueue = new TimedPayloadQueue(await channel);

    // Platform Release
    const platformListener = async (platform: Platform) => {
        const post = await channel;
        if (post == void 0) {
            discord.off("platformRelease", platformListener);
            return;
        };

        if (isPreview !== platform.fetchPreview
            || data.version.encode() !== platform.latestVersion.encode())
            return;

        payloadQueue.add([
            ...platformRelease(post, platform),
            (message: Message) => {
                if (platform.name !== "Microsoft Store")
                    return;
                
                const type = isPreview ? "Preview" : (isHotfix ? "Hotfix" : "Release");
                pingMembers(message, `Minecraft ${type} v${data.version.toString()} is now out on the Microsoft Store!\n\n`);
            },
        ]);
    };
    discord.on("platformRelease", platformListener);

    const allDone = (mcPreview: boolean, articleData: ArticleData) => {
        if (isPreview !== mcPreview
            || data.version.encode() !== articleData.version.encode())
            return;

        discord.off("platformRelease", platformListener);
        discord.off("allPlatformsDone", allDone);
    };
    discord.on("allPlatformsDone", allDone);

    const post = await channel;
    if (post == void 0)
        return;

    const message = await post.fetchStarterMessage();
    if (message == void 0)
        return post;

    pingMembers(message, `New update changelog! Version: ${data.version.toString()}\n\n`);
};

async function pingMembers(message: Message, content = "") {
    const pings: string[] = JSON.parse(
        fs.readFileSync("integrations/discord/data/pings.json").toString()
    );

    if (!Array.isArray(pings) || pings.length === 0)
        return;

    try {
        const ping = await message.reply({
            content: content.concat("-# ",
                pings
                .map((id) => `<@${id}>`)
                .join(" ")
            ),
            allowedMentions: {
                parse: [ "users" ],
                repliedUser: false,
            },
        });

        if (await ping.fetch(true) !== void 0)
            await ping.delete();
    }
    catch {};
};
