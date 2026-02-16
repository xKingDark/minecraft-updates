import { Client, GatewayIntentBits } from "npm:discord.js";
const isDev = process.argv.includes("--dev");

import Logger, { LogLevel } from "../../src/util/logger.ts";
import { Integration } from "../../src/integrations/integration.ts";
import { Events } from "../../src/integrations/events.ts";

import { ArticleData } from "../../src/changelog.ts";
import registerEvents from "./events/index.ts";
import { DiscordRelease } from "./services/release-dispatcher.ts";

export default class Discord extends Integration {
    private releaseDispatcher = new DiscordRelease(this);
    static {
        if (Deno.env.get("DISCORD_INTEGRATION")?.toLowerCase() === "true") {
            this.register();
        };
    };

    public CLIENT: Client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessageReactions,
        ],
    });

    constructor() {
        super();
        this.on(Events.NewChangelog, this.onNewChangelog);

        registerEvents(this.CLIENT);
        this.start();
    };

    public async start() {
        try {
            await this.CLIENT.login(
                isDev
                    ? Deno.env.get("TOKEN_TEST")
                    : Deno.env.get("TOKEN")
            );
        }
        catch(error) {
            Logger.log(LogLevel.Error, error);
            setTimeout(() => this.start(), 5000);
        };
    };


    private onNewChangelog = async(isPreview: boolean, isHotfix: boolean, data: ArticleData) => {
        this.releaseDispatcher.handle(isPreview, isHotfix, data);
    };
};