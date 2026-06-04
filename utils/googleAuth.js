import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

// Returns { isExistingUser: boolean } — callers use this to notify the user when
// they hit "Sign up with Google" but already have an account.
export const signInWithGoogle = async () => {
  const redirectUri = 'remi://auth/callback';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
      // Force the Google account picker on every attempt so the user can choose
      // which account to use and isn't silently signed into a cached account.
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== 'success' || !result.url) return null;

  const url = new URL(result.url);

  const resolveUser = async (user) => {
    // Check if this Google account already has a completed profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    // Persist avatar without blocking navigation
    supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: user.user_metadata?.avatar_url ?? null }, { onConflict: 'id' })
      .then(() => {});

    return { isExistingUser: profile?.onboarding_completed === true };
  };

  // PKCE flow — code in query params
  const code = url.searchParams.get('code');
  if (code) {
    const { data: sessionData, error: sessionErr } =
      await supabase.auth.exchangeCodeForSession(code);
    if (sessionErr) throw sessionErr;

    const user = sessionData?.session?.user;
    if (!user) throw new Error('No user returned from Google');

    return resolveUser(user);
  }

  // Implicit flow fallback — tokens in hash
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken && refreshToken) {
    const { data: sessionData, error: sessionErr } =
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionErr) throw sessionErr;

    const user = sessionData?.session?.user;
    if (!user) throw new Error('No user returned from Google');

    return resolveUser(user);
  }

  const oauthError =
    url.searchParams.get('error_description') || url.searchParams.get('error');
  throw new Error(oauthError || 'No authorization code or tokens in redirect URL');
};
