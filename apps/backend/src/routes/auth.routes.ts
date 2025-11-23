import { Router } from "express";
import { getUser, googleAuthSignIn, handleGoogleAuthCallback, handleSignInCallback, signin, signInWithGoogle, signup } from "../controllers/auth.controller";
import { isLoggedIn } from "../middlewares/auth.middleware";

const router = Router();

router.post('/signin', signin )
router.post('/signup', signup)
router.get('/me', isLoggedIn, getUser)
router.get('/google', isLoggedIn, signInWithGoogle)
router.get('/google/callback', isLoggedIn, handleSignInCallback)
router.get('/google-auth', googleAuthSignIn)
router.get('/google-auth/callback', handleGoogleAuthCallback)


export default router