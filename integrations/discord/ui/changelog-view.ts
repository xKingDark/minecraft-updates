import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
} from "npm:discord.js";

import { ArticleData } from "../../../src/changelog.ts";

export function buildChangelogView(
    data: ArticleData,
    isPreview: boolean,
    isHotfix: boolean
) {
    const emoji =
        isPreview ? "🍌"
        : isHotfix ? "🌶"
        : "🍋‍🟩";

    const type =
        isPreview ? "Preview"
        : isHotfix ? "Hotfix"
        : "Stable";

    const accentColor =
        isPreview ? 0xFFCC00
        : isHotfix ? 0xDA2F47
        : 0x46FF27;

    const container = new ContainerBuilder()
        .setAccentColor(accentColor);

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(`## ${emoji} ${data.article.title}`)
    );

    const description = isPreview
        ? [
            "It's that day of the week!",
            "A new Preview release for Minecraft: Bedrock Edition is out now!"
        ]
        : [
            isHotfix
                ? "A new spicy stable release is out now!"
                : "A new stable release is out now!"
        ];

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description.join("\n"))
    );

    if (data.thumbnail) {
        const media = new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder()
                .setDescription(data.article.title)
                .setURL(data.thumbnail)
        );

        container.addMediaGalleryComponents(media);
    }

    const date = Math.floor(
        new Date(data.article.updated_at).getTime() / 1000
    );

    container.addSeparatorComponents((s) =>
        s.setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(`-# Posted <t:${date}:R> — <t:${date}:F>`)
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel("Link")
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311574423609416", name: "changelog" })
            .setURL(data.article.url),

        new ButtonBuilder()
            .setLabel("Feedback")
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311572024463380", name: "feedback" })
            .setURL("https://feedback.minecraft.net/")
    );

    return { container, row, emoji, type };
};