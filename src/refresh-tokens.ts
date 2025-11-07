import { live, XSAPIClient } from "@xboxreplay/xboxlive-auth";
import * as readline from "npm:readline-sync";

import Logger, { LogLevel } from "./util/logger.ts";
import * as env from "./util/env.ts";

import XboxApp from "./platforms/xbox-app.ts";

// Credits to https://github.com/LukasPAH/minecraft-windows-gdk-version-db
(async () => {
    const authUrl = live.getAuthorizeUrl(XboxApp.CLIENT_ID, XboxApp.SCOPE, "code", XboxApp.REDIRECT_URL);

    Logger.log(LogLevel.Info,
        "Enter this link in a web browser and paste back the link in the console after authenticating:");

    const userResponse = readline.question(authUrl + "\n\n");
    if (!userResponse.includes("login.live.com")) {
        Logger.log(LogLevel.Error, "Failed to extract the code from the provided link");
        return;
    };

    const regexMatch = userResponse.match(/code=(.+)&/);
    if (regexMatch === null) {
        Logger.log(LogLevel.Error, "Failed to extract the code from the provided link");
        return;
    };

    const code = regexMatch[1];
    const url = `https://login.live.com/oauth20_token.srf?client_id=${XboxApp.CLIENT_ID}&code=${code}&redirect_uri=${XboxApp.REDIRECT_URL}&grant_type=authorization_code&scope=${XboxApp.SCOPE}`;

    const XSAPIData = await XSAPIClient.get(url);
    env.updateEnv(".env", "REFRESH_TOKEN", XSAPIData.data.refresh_token);
})();