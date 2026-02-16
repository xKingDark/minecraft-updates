const isDev = Deno.args.includes("--dev");

export default JSON.parse(
    Deno.readTextFileSync(
        isDev
            ? "integrations/discord/data/config-test.json"
            : "integrations/discord/data/config.json"
    )
);