import fs from "node:fs";
import path from "node:path";

import htmlParser from "npm:node-html-parser";
import Version from "./util/version.ts";

export interface ArticleData {
    version: Version;
    thumbnail: string | null;
    article: {
        id: number;
        url: string;
        title: string;
        created_at: string;
        updated_at: string;
        edited_at: string;
    };
};

export default class Changelog {
    public static async fetchLatestChangelog(
        callback: (isPreivew: boolean, data: ArticleData) => void
    ) {
        const response = await fetch("https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json");
        const { articles }: { articles: any[] } = await response.json();

        // Find latest Preview article
        const preview = articles.find((article: any) =>
            article.section_id == 360001185332);
        
        callback(true, formatArticle(preview, true));

        // Find latest Stable/Hotfix article
        const stable = articles.find((article: any) =>
            article.section_id == 360001186971
            && (
                !article.title.includes("Java Edition")
                || article.title.includes("MCPE")
                || article.title.includes("Bedrock")
            ));
            
        callback(false, formatArticle(stable));
    };

    public static getLatestSavedVersion(isPreview: boolean): Version {
        if (!fs.existsSync("data")) {
            fs.mkdirSync("data");
        };

        const articlePath = path.join("data",
            (isPreview ? "preview-articles" : "stable-articles").concat(".json"));
        
        if (!fs.existsSync(articlePath)) {
            return new Version(0, 0, 0);
        };

        const data: ArticleData[] = JSON.parse(
            Deno.readTextFileSync(articlePath)
        );

        const article = data.sort(
            ({ article: a }, { article: b }) => {
                const encodedA = (isPreview
                    ? Version.fromUpdatedString(a.title) : Version.fromString(a.title)).encode();
                const encodedB = (isPreview
                    ? Version.fromUpdatedString(b.title) : Version.fromString(b.title)).encode();

                return encodedB - encodedA;
            },
        )[0];

        return (isPreview
            ? Version.fromUpdatedString(article?.article?.title) : Version.fromString(article?.article?.title));
    };

    public static saveArticle(isPreview: boolean, data: ArticleData) {
        if (!fs.existsSync("data")) {
            fs.mkdirSync("data");
        };

        const article = path.join("data",
            (isPreview ? "preview-articles" : "stable-articles").concat(".json"));

        let articles: ArticleData[] = [];
        if (fs.existsSync(article)) {
            articles = JSON.parse(
                Deno.readTextFileSync(article)
            );
        };

        articles.unshift(data);
        fs.writeFileSync(article, JSON.stringify(articles, null, 4));
    };
};

export function formatArticle(article: any, isPreview: boolean = false): ArticleData {
    const parsed = htmlParser.parse(article.body);
    const imageSrc = parsed.getElementsByTagName("img")[0]?.getAttribute("src");

    return {
        version: isPreview ? Version.fromUpdatedString(article.name) : Version.fromString(article.name),
        thumbnail: (
            imageSrc?.startsWith("https://feedback.minecraft.net/hc/article_attachments/")
            ? imageSrc : null
        ),
        article: {
            id: article.id,
            url: "https://feedback.minecraft.net/hc/en-us/articles/".concat(article.id),
            title: article.title,
            created_at: article.created_at,
            updated_at: article.updated_at,
            edited_at: article.edited_at,
        },
    };
};