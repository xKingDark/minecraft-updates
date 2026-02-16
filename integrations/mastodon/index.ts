import { createRestAPIClient, mastodon } from "npm:masto";

import { Integration } from "../../src/integrations/integration.ts";
import { Events } from "../../src/integrations/events.ts";

import { ArticleData } from "../../src/changelog.ts";
import { MastodonRelease } from "./services/release-dispatcher.ts";

export default class Mastodon extends Integration {
    private releaseDispatcher = new MastodonRelease(this);
    static {
        if (Deno.env.get("MASTO_INTEGRATION")?.toLowerCase() === "true") {
            this.register();
        };
    };

    public CLIENT: mastodon.rest.Client = createRestAPIClient({
        url: Deno.env.get("MASTO_URL")!,
        accessToken: Deno.env.get("MASTO_TOKEN")!
    });

    constructor() {
        super();
        this.on(Events.NewChangelog, this.onNewChangelog);

        this.start();
    };

    public async start() {};
    
    
    private onNewChangelog = async(isPreview: boolean, isHotfix: boolean, data: ArticleData) => {
        this.releaseDispatcher.handle(isPreview, isHotfix, data);
    };
};