import { Events } from "../integrations/events.ts";
import { Platform } from "../platforms/common.ts";
import { ArticleData } from "../changelog.ts";

export abstract class ReleaseDispatcher<TPost> {
    constructor(protected integration: any) {};

    protected abstract postChangelog(
        isPreview: boolean,
        isHotfix: boolean,
        data: ArticleData
    ): Promise<TPost | undefined>;

    protected abstract postPlatformRelease(
        post: TPost,
        platform: Platform
    ): Promise<void>;

    protected onReleaseComplete(post: TPost): void {};

    async handle(
        isPreview: boolean,
        isHotfix: boolean,
        data: ArticleData
    ) {
        const changelogPost = this.postChangelog(isPreview, isHotfix, data);

        const platformListener = async (platform: Platform) => {
            const post = await changelogPost;
            if (!post)
                return;

            if (
                isPreview !== platform.fetchPreview
                || data.version.encode() !== platform.latestVersion.encode()
            ) return;

            await this.postPlatformRelease(post, platform);
        };

        const cleanup = async (
            preview: boolean,
            article: ArticleData
        ) => {
            if (
                preview !== isPreview
                || article.version.encode() !== data.version.encode()
            ) return;

            const post = await changelogPost;
            if (post !== void 0) {
                this.onReleaseComplete(post);
            };

            this.integration.off(Events.NewRelease, platformListener);
            this.integration.off(Events.AllDone, cleanup);
        };

        this.integration.on(Events.NewRelease, platformListener);
        this.integration.on(Events.AllDone, cleanup);
    };
};