import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { is_simple_mode } = await req.json();

    if (typeof is_simple_mode !== "number" && typeof is_simple_mode !== "boolean") {
      return NextResponse.json({ error: "is_simple_mode must be a number or boolean" }, { status: 400 });
    }

    const val = is_simple_mode ? 1 : 0;
    await db.run("UPDATE users SET is_simple_mode = ? WHERE id = ?", val, user.id);

    return NextResponse.json({ success: true, is_simple_mode: val });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
