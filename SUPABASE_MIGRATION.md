# Supabase Migration Plan

Migrating Remi from Firebase (Auth + Firestore) to Supabase (Auth + Postgres).

---

## Current Firebase Structure

### Auth
- Email/password only (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`)

### Firestore Collections

**`users/{uid}`** — one document per user, keyed by Firebase UID
| Field | Type | Notes |
|---|---|---|
| `nickname` | string | Display name |
| `username` | string | Unique, used for uniqueness checks |
| `course` | string | e.g. "Computer Science" |
| `current_semester` | number | |
| `total_semesters` | number | |
| `study_stage` | string | e.g. "undergraduate" |
| `age_range` | string | onboarding |
| `heard_from` | string | onboarding |
| `purpose` | string[] | onboarding |
| `selected_curriculum` | string | e.g. "uganda" |
| `grading_scale` | object | set by curriculum selector |
| `units` | object | `{ "1": [...], "2": [...] }` — semester-keyed arrays of unit objects |
| `timetable` | object | `{ "Monday": [...], ... }` — day-keyed arrays of lecture objects |
| `exams` | object[] | `[{ name, date, start, room, reminder, id, createdAt }]` |
| `gpa_data` | object | computed GPA per semester |
| `onboarding_completed` | boolean | |
| `onboarding_completed_at` | timestamp | |
| `fun_notifications_scheduled` | boolean | |
| `fun_notifications_scheduled_at` | timestamp | |
| `updated_at` | timestamp | |

**`fun_notifications/{id}`** — admin-managed global push notification templates
| Field | Type |
|---|---|
| `title` | string |
| `body` | string |
| `category` | string (`fun`, `motivation`, `wellness`, `productivity`, `holiday`, `exam`) |
| `active` | boolean |
| `times_sent` | number |
| `last_sent_at` | timestamp |

**`users/{uid}/chat_history/{id}`** — subcollection, chatbot message history
| Field | Type |
|---|---|
| `message` | string |
| `is_user` | boolean |
| `timestamp` | serverTimestamp |

---

## Supabase Schema

### Step 1 — Run in Supabase SQL Editor

```sql
-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Mirrors Firestore users/{uid}. id matches auth.users.id (Supabase UID).
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname        TEXT,
  username        TEXT UNIQUE,
  course          TEXT,
  current_semester INTEGER,
  total_semesters INTEGER,
  study_stage     TEXT,
  age_range       TEXT,
  heard_from      TEXT,
  purpose         TEXT[]          DEFAULT '{}',
  selected_curriculum TEXT        DEFAULT 'uganda',
  grading_scale   JSONB           DEFAULT '{}',
  units           JSONB           DEFAULT '{}',
  timetable       JSONB           DEFAULT '{}',
  exams           JSONB           DEFAULT '[]',
  gpa_data        JSONB           DEFAULT '{}',
  onboarding_completed       BOOLEAN      DEFAULT FALSE,
  onboarding_completed_at    TIMESTAMPTZ,
  fun_notifications_scheduled      BOOLEAN DEFAULT FALSE,
  fun_notifications_scheduled_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create a profile row when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── fun_notifications ─────────────────────────────────────────────────────────
CREATE TABLE fun_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'fun',
  active      BOOLEAN DEFAULT TRUE,
  times_sent  INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── chat_history ──────────────────────────────────────────────────────────────
CREATE TABLE chat_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  is_user    BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX chat_history_user_id_idx ON chat_history(user_id);
CREATE INDEX chat_history_created_at_idx ON chat_history(created_at);
```

### Step 2 — Row Level Security (RLS)

```sql
-- profiles: users can only read/write their own row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner can read"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: owner can update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- fun_notifications: everyone can read active ones; only service role can write
ALTER TABLE fun_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fun_notifications: public read active"
  ON fun_notifications FOR SELECT USING (active = TRUE);

-- chat_history: users can only see their own messages
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_history: owner read"
  ON chat_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_history: owner insert"
  ON chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_history: owner delete"
  ON chat_history FOR DELETE USING (auth.uid() = user_id);
```

---

## Code Changes

### 1. Install Supabase, remove Firebase

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
# AsyncStorage is already installed (keep it — Supabase auth also uses it)

# Remove Firebase packages after migration is complete:
# npm uninstall firebase
```

### 2. Replace `firebase.js` → `supabase.js`

```js
// supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

All files currently import `{ auth, db } from '../../firebase'`.
Replace with `{ supabase } from '../../supabase'` (adjust relative path per file).

### 3. Auth changes

| Firebase | Supabase |
|---|---|
| `createUserWithEmailAndPassword(auth, email, pw)` | `supabase.auth.signUp({ email, password })` |
| `signInWithEmailAndPassword(auth, email, pw)` | `supabase.auth.signInWithPassword({ email, password })` |
| `signOut(auth)` | `supabase.auth.signOut()` |
| `auth.currentUser.uid` | `(await supabase.auth.getUser()).data.user.id` |
| `onAuthStateChanged(auth, cb)` | `supabase.auth.onAuthStateChange((event, session) => cb(session?.user))` |

**Files to update:** `App.js`, `screens/auth/Login/LoginScreen.js`, `screens/auth/SignUp/SignupScreen.js`, `screens/settings/SettingsHome/SettingsScreen.js`, `screens/DataProtection/DataDeletion/DataDeleteScreen.js`

### 4. Firestore → Supabase data operations

#### Read user document
```js
// Firebase
const userDocRef = doc(db, "users", auth.currentUser.uid);
const userDoc = await getDoc(userDocRef);
const userData = userDoc.data();

// Supabase
const { data: userData } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### Update user document (merge: true equivalent)
```js
// Firebase
await setDoc(userDocRef, { timetable: newTimetable }, { merge: true });

// Supabase (upsert merges by default on conflict)
await supabase
  .from('profiles')
  .update({ timetable: newTimetable })
  .eq('id', userId);
```

#### Atomic field-level update
```js
// Firebase
await updateDoc(userDocRef, { nickname: value, updated_at: new Date() });

// Supabase
await supabase
  .from('profiles')
  .update({ nickname: value })   // updated_at handled by trigger
  .eq('id', userId);
```

#### Username uniqueness check
```js
// Firebase
const q = query(usersRef, where("username", "==", username));
const snap = await getDocs(q);
const isTaken = !snap.empty;

// Supabase
const { data } = await supabase
  .from('profiles')
  .select('id')
  .eq('username', username)
  .maybeSingle();
const isTaken = data !== null;
```

#### fun_notifications — read active
```js
// Firebase
const q = query(collection(db, 'fun_notifications'), where('active', '==', true));
const snap = await getDocs(q);

// Supabase
const { data: notifications } = await supabase
  .from('fun_notifications')
  .select('*')
  .eq('active', true);
```

#### fun_notifications — increment timesSent
```js
// Firebase
await updateDoc(notificationRef, { timesSent: increment(1), lastSentAt: new Date() });

// Supabase (use a Postgres function for atomic increment, or RPC)
await supabase.rpc('increment_times_sent', { notification_id: id });
// or with service role from Edge Function:
await supabase
  .from('fun_notifications')
  .update({ times_sent: currentCount + 1, last_sent_at: new Date() })
  .eq('id', id);
```

Add this function in SQL Editor:
```sql
CREATE OR REPLACE FUNCTION increment_times_sent(notification_id UUID)
RETURNS VOID AS $$
  UPDATE fun_notifications
  SET times_sent = times_sent + 1, last_sent_at = NOW()
  WHERE id = notification_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

#### chat_history — load messages
```js
// Firebase
const chatRef = collection(db, "users", uid, "chat_history");
const q = query(chatRef, orderBy("timestamp", "asc"));
const snap = await getDocs(q);
const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Supabase
const { data: messages } = await supabase
  .from('chat_history')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: true });
```

#### chat_history — save message
```js
// Firebase
await addDoc(chatRef, { message, isUser, timestamp: serverTimestamp() });

// Supabase
await supabase
  .from('chat_history')
  .insert({ user_id: userId, message, is_user: isUser });
// created_at is set by DEFAULT NOW()
```

### 5. Delete field equivalent

```js
// Firebase
await updateDoc(userDocRef, { someField: deleteField() });

// Supabase
await supabase
  .from('profiles')
  .update({ some_field: null })
  .eq('id', userId);
```

---

## Files to Change (Full List)

| File | What changes |
|---|---|
| `firebase.js` | Replace entirely with `supabase.js` |
| `App.js` | Auth listener, user doc reads, migration logic |
| `utils/onboardingUtils.js` | getDoc → select, updateDoc → update |
| `utils/gradingScales.js` | getDoc → select, setDoc → update |
| `utils/usernameHelper.js` | getDocs query → select with eq |
| `contexts/NotificationsContext.js` | Auth listener, user doc read, fun_notifications read, increment |
| `screens/auth/Login/LoginScreen.js` | signInWithEmailAndPassword |
| `screens/auth/SignUp/SignupScreen.js` | createUserWithEmailAndPassword, setDoc (create profile) |
| `screens/onboarding/OnboardingScreen.js` | setDoc → update |
| `screens/Home/HomeScreen.js` | getDoc → select |
| `screens/Profile/ProfileScreen.js` | getDoc → select |
| `screens/settings/SettingsHome/SettingsScreen.js` | getDoc, updateDoc, signOut |
| `screens/settings/EditNickname/EditNickname.js` | getDoc → select, updateDoc → update |
| `screens/settings/EditCourse.js` | getDoc, updateDoc |
| `screens/settings/EditCurrentSemester.js` | getDoc, updateDoc |
| `screens/settings/EditUnits.js` | getDoc, updateDoc |
| `screens/settings/NotificationsSettings/NotificationsSettingsScreen.js` | getDoc, updateDoc |
| `screens/gpa/GPAHome/GPAScreen.js` | getDoc, setDoc |
| `screens/gpa/ScanResults/ScanResultsScreen.js` | getDoc, setDoc |
| `screens/gpa/ReviewScannedResults/ReviewScannedResultsScreen.js` | getDoc, setDoc |
| `screens/gpa/CurriculumSelector/CurriculumSelectorScreen.js` | getDoc, setDoc |
| `screens/gpa/ExportGPA/ExportGPAScreen.js` | getDoc |
| `screens/timetable/TimetableHome/TimetableScreen.js` | getDoc, setDoc |
| `screens/timetable/EditTimetable/EditTimetableScreen.js` | getDoc, setDoc |
| `screens/timetable/AddActivity/AddActivityScreen.js` | getDoc, setDoc |
| `screens/timetable/AI_Scanner/AITimetableScanner.js` | getDoc, setDoc |
| `screens/timetable/ReviewScannedInfo/ReviewScannedLectures.js` | getDoc, setDoc |
| `screens/exam/AddExamScreen.js` | getDoc, setDoc |
| `screens/chatbot/ChatScreen.js` | addDoc, getDocs subcollection |
| `screens/admin/ManageFunNotifications.js` | getDocs, addDoc, updateDoc, deleteDoc on fun_notifications |
| `screens/admin/StatisticsDashboard/StatisticsDashboard.js` | getDocs on users |
| `screens/DataProtection/DataDeletion/DataDeleteScreen.js` | signOut, deleteUser |

---

## Migration Order

1. **Set up Supabase project** — create project, run schema SQL, set up RLS
2. **Create `supabase.js`** — new client file
3. **Auth first** — Login, Signup, App.js auth listener (test sign in/out works)
4. **Profile read/write** — Settings screens, then Home (most used reads)
5. **Timetable + Exams** — TimetableScreen, AddActivity, AddExam
6. **GPA** — GPAScreen, ScanResults, ReviewScanned, CurriculumSelector
7. **Chat** — ChatScreen (subcollection → flat table)
8. **Admin screens** — ManageFunNotifications, StatisticsDashboard
9. **Onboarding** — OnboardingScreen, onboardingUtils
10. **Remove firebase package** — after all screens tested

---

## Data Migration (Existing Users)

If there are existing users in Firestore who need their data moved to Supabase:

1. Export Firestore data using `firebase-admin` in a one-off Node script
2. Re-create users in Supabase Auth using `supabase.auth.admin.createUser()` — note UIDs will change
3. Insert profile rows into `profiles` table with the new Supabase UIDs
4. Map old Firebase UID → new Supabase UID to preserve relationships

For a small user base it's easier to ask users to re-register. For larger bases, the admin script approach is necessary.

---

## Notes

- **JSONB fields** (`units`, `timetable`, `exams`, `gpa_data`): kept as JSONB to avoid a full schema redesign upfront. Can be normalized into separate tables later.
- **Admin writes to `fun_notifications`**: the current RLS only allows service-role writes. The admin screen (`ManageFunNotifications.js`) needs to use the Supabase service-role key (stored server-side, e.g. in an Edge Function) or a custom admin check via a Postgres policy that checks a trusted email list.
- **`deleteField()`**: Supabase has no equivalent — set the column to `NULL` instead.
- **`serverTimestamp()`**: replaced by `DEFAULT NOW()` on the column — no client-side call needed.
- **Real-time** (`onSnapshot`): if real-time sync is needed later, Supabase has `supabase.channel().on('postgres_changes', ...)`. Currently the app only uses one-shot reads so no real-time subscriptions are needed.
