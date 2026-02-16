import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";
fs.ensureDirSync("./data");

import * as Changelog from "./changelog.ts";
(async () => {
    const stableArticles: Changelog.ArticleData[] = [];
    const previewArticles: Changelog.ArticleData[] = [];

    const response = await fetch("https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100");
    const data = await response.json();

    for (let i = 1; i <= data.page_count; i++) {
        const response = await fetch("https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100&page=".concat(i.toString()));
        const { articles }: { articles: any[] } = await response.json();

        const stable = articles.filter((article: any) =>
            article.section_id == 360001186971
            && (
                !article.title.includes("Java Edition")
                || article.title.includes("MCPE")
                || article.title.includes("Bedrock")
            ));

        stableArticles.push(...stable.map((article) => {
            return Changelog.formatArticle(article, false);
        }));

        const preview = articles.filter((article: any) => article.section_id == 360001185332);
        previewArticles.push(...preview.map((article) => {
            return Changelog.formatArticle(article, true);
        }));
    };

    // Save the articles
    Deno.writeTextFileSync("data/stable-articles.json",
        JSON.stringify(stableArticles, null, 4 ));

    Deno.writeTextFileSync("data/preview-articles.json",
        JSON.stringify(previewArticles, null, 4 ));
})();