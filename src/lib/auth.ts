import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { refreshWidgets } from '@/widgets';

import { supabase } from './supabase';

let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
  username: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      data: { display_name: params.displayName.trim(), username: params.username.trim().toLowerCase() },
    },
  });
  if (error) throw error;
  // When email confirmation is enabled there is no session until the link is clicked.
  return { needsConfirmation: !data.session };
}

/** Returns false if the user cancelled. */
export async function signInWithGoogle(): Promise<boolean> {
  configureGoogle();
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return false;

  const idToken = response.data.idToken;
  if (!idToken) throw new Error('Google did not return an ID token');

  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
  return true;
}

/** Returns false if the user cancelled. */
export async function signInWithApple(): Promise<boolean> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }
  if (!credential.identityToken) throw new Error('Apple did not return an identity token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  // Apple only shares the name on the very first sign-in.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  if (name && data.user) {
    await supabase.from('profiles').update({ display_name: name }).eq('id', data.user.id);
  }
  return true;
}

export async function signOut() {
  try {
    if (googleConfigured) await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google.
  }
  await supabase.auth.signOut();
  // Widgets would otherwise keep showing this account's steps.
  refreshWidgets().catch(() => undefined);
}

/** Where the reset email link sends the user; must be listed under Redirect URLs in Supabase. */
export const PASSWORD_RESET_URL = 'beatmysteps://reset-password';

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: PASSWORD_RESET_URL });
  if (error) throw error;
}

/**
 * Signs in with the one-time session from a reset link. Handles both link styles:
 * tokens in the #fragment (implicit flow) and ?code= (PKCE flow).
 */
export async function startRecoverySession(url: string) {
  const [beforeHash, hash = ''] = url.split('#');
  const params = new URLSearchParams(hash);
  new URLSearchParams(beforeHash.split('?')[1] ?? '').forEach((v, k) => params.set(k, v));

  const linkError = params.get('error_description');
  if (linkError) throw new Error(linkError);

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return true;
  }
  return false;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export function authErrorMessage(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/already registered/i.test(msg)) return 'An account with this email already exists.';
  if (/password should be at least/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/email not confirmed/i.test(msg)) return 'Confirm your email using the link we sent you.';
  if (/network/i.test(msg)) return 'No internet connection.';
  if (/duplicate key.*username|profiles_username_key/i.test(msg)) return 'That username is taken.';
  if (/should be different from the old password/i.test(msg)) return "Choose a password you haven't used before.";
  if (/for security purposes|rate limit/i.test(msg)) return 'Too many attempts. Wait a minute and try again.';
  if (/expired|invalid.*(token|link)|otp/i.test(msg)) return 'This link has expired. Request a new one.';
  return msg;
}

export async function isUsernameAvailable(username: string) {
  const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
  if (error) throw error;
  return data as boolean;
}
