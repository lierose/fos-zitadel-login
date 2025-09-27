import { redirect } from "next/navigation";
import { getJWTFromCookies } from "@/lib/jwt";

export default async function Page() {
  const jwtPayload = await getJWTFromCookies();

  if (jwtPayload) {
    redirect("/profile");
  }

  redirect("/loginname");
}

