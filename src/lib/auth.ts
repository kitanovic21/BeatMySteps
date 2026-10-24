import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

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
  if (!idToken) throw new Error('Google nije vratio ID token');

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
  if (!credential.identityToken) throw new Error('Apple nije vratio identity token');

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
}

export function authErrorMessage(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/invalid login credentials/i.test(msg)) return 'Pogrešan email ili lozinka.';
  if (/already registered/i.test(msg)) return 'Nalog sa ovim emailom već postoji.';
  if (/password should be at least/i.test(msg)) return 'Lozinka mora imati bar 6 karaktera.';
  if (/email not confirmed/i.test(msg)) return 'Potvrdi email adresu preko linka koji smo ti poslali.';
  if (/network/i.test(msg)) return 'Nema internet konekcije.';
  if (/duplicate key.*username|profiles_username_key/i.test(msg)) return 'Korisničko ime je zauzeto.';
  return msg;
}

export async function isUsernameAvailable(username: string) {
  const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
  if (error) throw error;
  return data as boolean;
}
