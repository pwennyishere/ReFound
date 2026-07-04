import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword, createToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if user exists
    const existing = await db.get("SELECT id FROM users WHERE email = ? OR username = ?", email, username);
    if (existing) {
      return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const result = await db.run(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      username, email, password_hash
    );

    const user = await db.get("SELECT * FROM users WHERE id = ?", result.lastInsertRowid);
    const token = createToken(user);
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        is_simple_mode: user.is_simple_mode,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
