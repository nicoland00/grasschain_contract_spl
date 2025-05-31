// src/utils/ixorigue-auth.ts
export async function getRefreshedIxorigueToken(): Promise<string> {
    const refreshToken = process.env.IXORIGUE_REFRESH_TOKEN!;
    const res = await fetch(
      "https://sso.ixorigue.com/realms/master/protocol/openid-connect/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "platform",
          refresh_token: refreshToken,
        }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error_description || "Failed to refresh token");
    return json.access_token;
  }
  