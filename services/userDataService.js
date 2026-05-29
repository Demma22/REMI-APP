import { supabase } from '../supabase';

// Maps camelCase app keys → snake_case Supabase column names
const KEY_MAP = {
  heardFrom: 'heard_from',
  studyStage: 'study_stage',
  ageRange: 'age_range',
  currentSemester: 'current_semester',
  totalSemesters: 'total_semesters',
  selectedCurriculum: 'selected_curriculum',
  gradingScale: 'grading_scale',
  gpaData: 'gpa_data',
  onboardingCompleted: 'onboarding_completed',
  onboardingCompletedAt: 'onboarding_completed_at',
};

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([camel, snake]) => [snake, camel])
);

// Strict allowlist of writable columns — prevents mass-assignment
const WRITABLE_COLUMNS = new Set([
  'nickname', 'username', 'avatar_url', 'course', 'units', 'timetable', 'exams',
  'heard_from', 'study_stage', 'age_range', 'current_semester', 'total_semesters',
  'selected_curriculum', 'grading_scale', 'gpa_data',
  'onboarding_completed', 'onboarding_completed_at', 'purpose', 'timeZone',
]);

export const toSupabase = (data) => {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    const col = KEY_MAP[k] || k;
    if (WRITABLE_COLUMNS.has(col)) {
      out[col] = v;
    }
  }
  return out;
};

export const fromSupabase = (data) => {
  if (!data) return null;
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    out[REVERSE_KEY_MAP[k] || k] = v;
  }
  return out;
};

// ─── Session ──────────────────────────────────────────────────────────────────

export const getSupabaseSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getCurrentUserInfo = async () => {
  const session = await getSupabaseSession();
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email };
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getUserData = async () => {
  const session = await getSupabaseSession();
  if (!session?.user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return fromSupabase(data);
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const saveUserData = async (data) => {
  const session = await getSupabaseSession();
  if (!session?.user) throw new Error('No user logged in');
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: session.user.id, ...toSupabase(data) }, { onConflict: 'id' });
  if (error) throw error;
};

export const updateUserData = async (data) => {
  const session = await getSupabaseSession();
  if (!session?.user) throw new Error('No user logged in');
  const { error } = await supabase
    .from('profiles')
    .update(toSupabase(data))
    .eq('id', session.user.id);
  if (error) throw error;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signOutUser = async () => {
  await supabase.auth.signOut();
};
