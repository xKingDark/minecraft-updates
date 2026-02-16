import { mastodon } from "npm:masto";
import Mastodon from "../index.ts";
import { ArticleData } from "../../../src/changelog.ts";
import { Platform } from "../../../src/platforms/common.ts";
import { ReleaseDispatcher } from "../../../src/integrations/release-dispatcher.ts";

import { buildChangelogStatus } from "../ui/changelog-view.ts";

export class MastodonRelease extends ReleaseDispatcher<mastodon.v1.Status> {
    constructor(private masto: Mastodon) {
        super(masto);
    };

    protected async postChangelog(
        isPreview: boolean,
        isHotfix: boolean,
        data: ArticleData
    ) {
        const { mediaIds, status } =
            await buildChangelogStatus(this.masto, isPreview, isHotfix, data);

        return this.masto.CLIENT.v1.statuses.create({
            visibility: "public",
            status,
            mediaIds,
        });
    };

    protected async postPlatformRelease(
        status: mastodon.v1.Status,
        platform: Platform
    ) {
        await this.masto.CLIENT.v1.statuses.create({
            inReplyToId: status.id,
            status: platform.message
        });
    };
};