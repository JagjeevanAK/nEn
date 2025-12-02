import { prisma } from "@nen/db";
import type { Request, RequestHandler, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { CustomError } from "../utils/CustomError";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import ms, { type StringValue } from "ms";
import bcrypt from "bcryptjs";
import { generateCookieOptions } from "../config/cookie";
import { google } from "googleapis";

export const createHash = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const passwordMatch = async (
  enteredPassword: string,
  storedPassword: string
) => bcrypt.compare(enteredPassword, storedPassword);

export const generateAccessToken = (user: any) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as StringValue }
  );

export const generateRefreshToken = (user: any) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY as StringValue }
  );

export const signup: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    let existingUser;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    existingUser = user;
    if (existingUser) throw new CustomError(400, "User already exists");

    const newUser = await prisma.user.create({
      data: {
        email: email,
        passwordHash: password,
        name: name,
        lastLoggedId: new Date(),
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", newUser.id));
  }
);

export const signin: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("user not found in signin");
    throw new CustomError(400, "Invalid email or password");
  }
  const isPasswordValid = password === user.passwordHash;
  if (!isPasswordValid) {
    console.log("password is invalid");
    throw new CustomError(400, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const hashedRefreshToken = createHash(refreshToken);
  const expiresAt = new Date(
    Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY as StringValue)
  );
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { refreshToken: hashedRefreshToken, refreshTokenExpiry: expiresAt },
  });

  res
    .status(200)
    .cookie("accessToken", accessToken, generateCookieOptions())
    .cookie("refreshToken", refreshToken, generateCookieOptions())
    .json(new ApiResponse(200, "Login successful", updatedUser));
});

export const signout: RequestHandler = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json(new ApiResponse(200, "Logged out successfully", null));
});
export const logout = signout;

export const getUser: RequestHandler = asyncHandler(
  async (req: Request, res) => {
    const userId = req.user.id;
    if (!userId) throw new CustomError(400, "user not found ");

    try {
      const user = await prisma.user.findFirst({
        where: { id: req.user.id },
      });

      if (!user) throw new CustomError(404, "User not found");

      res.status(200).json(new ApiResponse(200, "User fetched", user));
    } catch (error) {
      throw new CustomError(401, "User can be fetched");
    }
  }
);
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/google/callback`
);
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const verifyGoogleToken = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new CustomError(400, "No credential provided");
  }

  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      throw new CustomError(400, "Invalid token payload");
    }


    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });


    if (!user) {
      const name = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim();
      
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: name || undefined,
          passwordHash: "",
          lastLoggedId: new Date(),
        },
      });
    } else {
      const updateData: any = { lastLoggedId: new Date() };
      
      if (!user.name && payload.name) {
        updateData.name = payload.name;
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, generateCookieOptions());
    res.cookie("refreshToken", refreshToken, generateCookieOptions());

    res.status(200).json(
      new ApiResponse(200, "Google authentication successful", {
        user: {
          id: user.id,
          email: user.email,
        },
      })
    );
  } catch (error) {
    console.error("Google token verification error:", error);
    throw new CustomError(401, "Invalid Google token");
  }
});


export const signInWithGoogle = asyncHandler(async (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
});

export const handleSignInCallback = asyncHandler(async (req, res) => {
  const code = req.query.code as string;

  const { tokens } = await oauth2Client.getToken(code);
  const userId = req.user.id;

  const createdCred = await prisma.userCredentials.create({
    data: {
      name: "Google Account",
      apiName: "gmailOAuth2",
      appIcon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r2.png", 
      application: "google",
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        id_token: tokens.id_token,
      },
    },
  });

  console.log(tokens);

  res.redirect(process.env.FRONTEND_URL || "http://localhost:5173/");
  res.status(200).json(new ApiResponse(200, "Google account connected", createdCred))
});
