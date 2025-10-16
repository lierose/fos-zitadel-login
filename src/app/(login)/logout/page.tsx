import { getAllSessionCookieIds } from "@/lib/cookies";
import { clearSession } from "@/lib/server/session";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;
  const postLogoutRedirectUri = searchParams?.post_logout_redirect || searchParams?.post_logout_redirect_uri;

  // Ensure server URL is resolvable (initializes headers context used by server libs)
  const _headers = await headers();
  getServiceUrlFromHeaders(_headers);

  const ids = await getAllSessionCookieIds();
  if (ids && ids.length) {
    for (const id of ids) {
      if (!id) continue;
      try {
        await clearSession({ sessionId: id });
      } catch (_) {
        // ignore individual errors and continue clearing the rest
      }
    }
  }

  if (postLogoutRedirectUri) {
    redirect(postLogoutRedirectUri as string);
  }

  redirect("/loginname");
}
