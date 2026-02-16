import {
    ForumThreadChannel,
    ChannelType,
    Message,
    MessageFlags
} from "npm:discord.js";

import Discord from "../index.ts";
import CONFIG from "../config.ts";
import { ArticleData } from "../../../src/changelog.ts";
import { Platform } from "../../../src/platforms/common.ts";
import { ReleaseDispatcher } from "../../../src/integrations/release-dispatcher.ts";

import { PingService } from "./ping.ts";
import { buildChangelogView } from "../ui/changelog-view.ts";
import TimedPayloadQueue from "../util/timed-payload-queue.ts";
import { buildPlatformComponents } from "../ui/platform-view.ts";

export class DiscordRelease extends ReleaseDispatcher<ForumThreadChannel> {
    private queues = new Map<string, TimedPayloadQueue>();
    private pingService = new PingService();
    
    constructor(private discord: Discord) {
        super(discord);
    };

    protected async postChangelog(
        isPreview: boolean,
        isHotfix: boolean,
        data: ArticleData
    ) {
        const { container, row, emoji, type } =
            buildChangelogView(data, isPreview, isHotfix);

        const channel = this.discord.CLIENT.channels.cache.get(CONFIG.channel);
        if (!channel || channel.type !== ChannelType.GuildForum)
            return;

        const thread = await channel.threads.create({
            name: `${emoji} ${type} ${data.version}`,
            appliedTags: [
                isPreview
                    ? CONFIG.tags.preview
                    : CONFIG.tags.stable
            ],
            message: {
                flags: MessageFlags.IsComponentsV2,
                components: [ container, row ],
            },
        });

        const starter = await thread.fetchStarterMessage();
        if (!starter)
            return;

        await starter.react(emoji).catch(() => {});
        await starter.pin().catch(() => {});

        await this.pingService.ping(
            starter,
            `New update changelog! Version: ${data.version.toString()}\n\n`
        );

        this.queues.set(thread.id, new TimedPayloadQueue(thread));
        return thread
    };

    protected onReleaseComplete(thread: ForumThreadChannel) {
        this.queues.delete(thread.id);
    };

    protected async postPlatformRelease(
        thread: ForumThreadChannel,
        platform: Platform
    ) {
        const queue = this.queues.get(thread.id);
        if (!queue)
            return;

        queue.add([
            ...buildPlatformComponents(platform),
            async (message: Message) => {
                if (platform.name !== "Microsoft Store")
                    return;

                const type = platform.latestVersion.stage?.toUpperCase();
                await this.pingService.ping(
                    message,
                    `Minecraft ${type} v${platform.latestVersion.toString()} is now out on the ${platform.name}!\n\n`
                );
            },
        ]);
    };
};