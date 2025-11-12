import { live, xnet } from "npm:@xboxreplay/xboxlive-auth";

import Logger, { LogLevel } from "../util/logger.ts";
import * as env from "../util/env.ts";

// Credits to https://github.com/LukasPAH/minecraft-windows-gdk-version-db
export default class XboxApp {
    public static CLIENT_ID = "00000000402b5328";
    public static SCOPE = "service::user.auth.xboxlive.com::MBI_SSL";
    public static REDIRECT_URL = "https://login.live.com/oauth20_desktop.srf";

    public static WINDOWS_RELEASE_ID = "7792d9ce-355a-493c-afbd-768f4a77c3b0";
    public static XBOX_RELEASE_ID = "8c7a6ccd-246c-4955-aeb6-b32e64fd95fd";
    public static WINDOWS_PREVIEW_ID = "98bd2335-9b01-4e4c-bd05-ccc01614078b";
    public static XBOX_PREVIEW_ID = "4fbf0c64-2569-4095-8c34-6124ce6fade7";

    public static async refreshTokens(): Promise<string | undefined> {
        const REFRESH_TOKEN = Deno.env.get("REFRESH_TOKEN");
        if (REFRESH_TOKEN === void 0) {
            Logger.log(LogLevel.Warn, "Xbox — Refresh token not found! Please generate a new token!");
            return;
        };
        
        const accessTokenResponse = await live.refreshAccessToken(REFRESH_TOKEN, XboxApp.CLIENT_ID, XboxApp.SCOPE);
        env.updateEnv(".env", "REFRESH_TOKEN", accessTokenResponse.refresh_token as string);

        const authenticationBody = {
            RelyingParty: "http://auth.xboxlive.com",
            TokenType: "JWT",
            Properties: {
                AuthMethod: "RPS",
                SiteName: "user.auth.xboxlive.com",
                RpsTicket: accessTokenResponse.access_token,
            },
        };

        const authenticationResponse = await fetch(new URL("user/authenticate", "https://user.auth.xboxlive.com/"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-xbl-contract-version": "1",
            },
            body: JSON.stringify(authenticationBody),
        });

        if (!authenticationResponse.ok)
            return;

        const authJson: any = await authenticationResponse.json();
        const userToken = authJson?.Token;
        const deviceToken = (await xnet.experimental.createDummyWin32DeviceToken()).Token;

        const updateBody = {
            RelyingParty: "http://update.xboxlive.com",
            TokenType: "JWT",
            Properties: {
                UserTokens: [userToken],
                SandboxId: "RETAIL",
                DeviceToken: deviceToken,
            },
        };

        const updateResponse = await fetch(new URL("xsts/authorize", "https://xsts.auth.xboxlive.com/"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-xbl-contract-version": "1",
            },
            body: JSON.stringify(updateBody),
        });

        if (!updateResponse.ok)
            return;

        const updateResponseJSON: any = await updateResponse.json();
        const authorizationHeader = `XBL3.0 x=${updateResponseJSON?.DisplayClaims?.xui?.[0]?.uhs};${updateResponseJSON?.Token}`;

        Deno.env.set("XBOX_HEADER", authorizationHeader);
        return authorizationHeader;
    };

    public static async getVersions(releaseType: string, authorizationHeader: string) {
        const baseURL = new URL("GetBasePackage/".concat(releaseType), "https://packagespc.xboxlive.com/")
        const versionsResponse = await fetch(baseURL, {
            method: "GET",
            headers: { Authorization: authorizationHeader },
        });

        if (!versionsResponse.ok)
            return;

        const versionsResponseJSON: any = await versionsResponse.json();
        for (const packageFile of versionsResponseJSON.PackageFiles) {
            if (!packageFile.FileName.endsWith(".msixvc") && !packageFile.FileName.endsWith(".xvc"))
                continue;

            const versionURLS: string[] = [];
            for (let i = 0; i < packageFile.CdnRootPaths.length; i++) {
                const versionURL = packageFile.CdnRootPaths[i] + packageFile.RelativeUrl;
                versionURLS.push(versionURL);
            };

            return versionURLS;
        };
    };
};