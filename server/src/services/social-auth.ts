import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env";
import { BadRequestError, UnauthorizedError } from "../types";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export async function verifyAppleIdentityToken(
  identityToken: string
): Promise<JWTPayload> {
  if (!env.APPLE_CLIENT_ID) {
    throw new BadRequestError("Apple Sign-In is not configured");
  }

  try {
    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: APPLE_ISSUER,
      audience: env.APPLE_CLIENT_ID,
    });
    return payload;
  } catch (error) {
    throw new UnauthorizedError("Invalid Apple identity token");
  }
}

export async function verifyGoogleIdToken(
  idToken: string
): Promise<JWTPayload> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new BadRequestError("Google Sign-In is not configured");
  }

  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: env.GOOGLE_CLIENT_ID,
    });
    return payload;
  } catch (error) {
    throw new UnauthorizedError("Invalid Google ID token");
  }
}
