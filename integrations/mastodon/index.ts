import { createRestAPIClient, mastodon } from "npm:masto";

import { Integration } from "../integration.ts";
import { Events } from "../events.ts";

import { onNewChangelog } from "./functionality.ts";
import { ArticleData } from "../../src/changelog.ts";

export default class Mastodon extends Integration {
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
        onNewChangelog(this, isPreview, isHotfix, data);
    };
};