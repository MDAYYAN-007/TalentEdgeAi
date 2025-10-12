import { NextResponse } from "next/server";
import { query } from "@/actions/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch user
    const userRes = await query("SELECT * FROM users WHERE email=$1", [email]);
    if (!userRes.rows.length)
      return NextResponse.json(
        { success: false, message: "No account found with this email" },
        { status: 404 }
      );

    const user = userRes.rows[0];

    // 2️⃣ Check verification
    if (!user.verified)
      return NextResponse.json(
        { success: false, message: "Please verify your email first" },
        { status: 401 }
      );

    // 3️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return NextResponse.json(
        { success: false, message: "Incorrect password" },
        { status: 401 }
      );

    // 4️⃣ Create full name
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    // 5️⃣ Generate JWT — include isProfileComplete
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: fullName,
        isProfileComplete: user.isprofilecomplete || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: fullName,
        isProfileComplete: user.isprofilecomplete || false,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error" },
      { status: 500 }
    );
  }
}
