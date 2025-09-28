import { redirectToIdp } from "@/lib/server/idp";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const result = await redirectToIdp(undefined, formData);

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result?.redirect) {
      return NextResponse.json({ redirect: result.redirect });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to redirect to identity provider" }, { status: 500 });
  }
}
