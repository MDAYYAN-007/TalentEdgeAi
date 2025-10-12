import { NextResponse } from "next/server";
import { query } from "@/actions/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    // Parse request body
    let email, password;
    try {
      const body = await req.json();
      email = body.email;
      password = body.password;
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Check if user exists
    const userRes = await query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!userRes.rows.length) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No account found with this email address",
          errorType: "user_not_found"
        },
        { status: 404 }
      );
    }

    const user = userRes.rows[0];

    // 2️⃣ Check if email is verified
    if (!user.verified) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Please verify your email before signing in",
          errorType: "email_not_verified",
          email: user.email
        },
        { status: 401 }
      );
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Incorrect password. Please try again",
          errorType: "invalid_password"
        },
        { status: 401 }
      );
    }

    // 4️⃣ Build full name
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    // 5️⃣ Create JWT token including full name
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: fullName
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    // 6️⃣ Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: fullName
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { success: false, message: "Database connection error. Please try again later" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again" },
      { status: 500 }
    );
  }
}
