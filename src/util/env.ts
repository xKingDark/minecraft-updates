export async function updateEnv(path: string, key: string, value: string) {
    const text = await Deno.readTextFile(path);
    const regex = new RegExp(`^${key}=.*$`, "m");

    const string = key.concat("=", value);
    const updated = regex.test(text)
        ? text.replace(regex, string)
        : text.trim().concat("\n", string);

    Deno.env.set(key, value);
    await Deno.writeTextFile(path, updated);
};