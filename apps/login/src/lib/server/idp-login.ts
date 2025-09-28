"use server";

import { getUserByID } from "@/lib/zitadel";
import { createJWT, setJWTCookie } from "@/lib/jwt";
import { redirect } from "next/navigation";

export async function createJWTAndRedirectToProfile(userId: string, serviceUrl: string, idpUserName?: string) {
  try {
    const userResponse = await getUserByID({
      serviceUrl,
      userId: userId,
    });

    if (userResponse?.user) {
      const humanUser = userResponse.user.type.case === "human" ? userResponse.user.type.value : undefined;

      const jwtPayload = {
        userId: userId,
        loginName: userResponse.user.preferredLoginName || idpUserName || "",
        organizationId: userResponse.user.details?.resourceOwner,
        displayName: humanUser?.profile?.displayName,
      };

      const jwtToken = await createJWT(jwtPayload);

      await setJWTCookie(jwtToken, 86400);

      redirect("/profile");
    }

    throw new Error("User not found");
  } catch (error) {
    console.error("❌ Error creating JWT for IDP login:", error);
    throw error;
  }
}

export async function handleIdpLoginWithJWT(userId: string, serviceUrl: string, idpUserName?: string) {
  "use server";

  try {
    const userResponse = await getUserByID({
      serviceUrl,
      userId: userId,
    });

    if (userResponse?.user) {
      const humanUser = userResponse.user.type.case === "human" ? userResponse.user.type.value : undefined;

      const jwtPayload = {
        userId: userId,
        loginName: userResponse.user.preferredLoginName || idpUserName || "",
        organizationId: userResponse.user.details?.resourceOwner,
        displayName: humanUser?.profile?.displayName,
      };

      const jwtToken = await createJWT(jwtPayload);

      await setJWTCookie(jwtToken, 86400);

      redirect("/profile");
    }

    throw new Error("User not found");
  } catch (error) {
    throw error;
  }
}
