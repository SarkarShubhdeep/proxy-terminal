const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

interface UserinfoResponse {
  email?: string;
}

export async function fetchUserEmail(accessToken: string): Promise<string> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch account info from Google.");
  }

  const data = (await response.json()) as UserinfoResponse;

  if (!data.email) {
    throw new Error("Google account did not return an email address.");
  }

  return data.email;
}
