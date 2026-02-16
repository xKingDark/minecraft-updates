import { ArticleData } from "../changelog.ts";
import { Platform } from "../platforms/common.ts";

export enum Events {
    NewChangelog = "newChangelog",
    NewRelease = "newRelease",
    AllDone = "allDone",
};

export type IntegrationEvents = {
    [Events.NewChangelog]: [
        /** isPreview */ boolean,
        /** isHotfix */ boolean,
        ArticleData
    ];
    [Events.NewRelease]: [ Platform ];
    [Events.AllDone]: [ /** isPreview */ boolean, ArticleData ];
};