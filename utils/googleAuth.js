import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'com.anonymous.remi',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Could not get Google sign-in URL');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') return null;

  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(result.url);

  if (sessionError) throw sessionError;

  const user = sessionData?.session?.user;
  if (!user) throw new Error('No user returned from Google');

  // Save Google profile photo to profiles table
  await supabase
    .from('profiles')
    .upsert(
      { id: user.id, avatar_url: user.user_metadata?.avatar_url ?? null },
      { onConflict: 'id' }
    );

  // Check if they have completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  return {
    user,
    onboardingCompleted: profile?.onboarding_completed === true,
  };
};
