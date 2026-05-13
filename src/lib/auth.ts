import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { User, Role } from "@/types/user";

const secretKey = (() => {
  const key = process.env.JWT_SECRET;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("FATAL: JWT_SECRET environment variable is not set. Set it in your Vercel environment variables.");
    }
    console.warn("\x1b[33m[AUTH WARNING] JWT_SECRET is not set. Using insecure fallback for local development only.\x1b[0m");
    return "super_secret_for_local_development_only_replace_this";
  }
  return key;
})();
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function getSession() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return NextResponse.next();
  
  try {
    // refresh the session
    const parsed = await decrypt(session);
    parsed.expires = Date.now() + 24 * 60 * 60 * 1000;
    
    const res = NextResponse.next();
    res.cookies.set({
      name: "session",
      value: await encrypt(parsed),
      httpOnly: true,
      expires: new Date(parsed.expires as number),
      sameSite: "lax"
    });
    return res;
  } catch(e) {
    return NextResponse.next();
  }
}

export async function setLoginSession(user: User) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user: user.username, role: user.role, expires: expires.getTime() });
  cookies().set("session", session, { expires, httpOnly: true, sameSite: "lax" });
}

export async function clearSession() {
  cookies().delete("session");
}
