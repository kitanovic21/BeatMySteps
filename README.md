# BeatMySteps 👟

Mobilna aplikacija (iOS + Android) za praćenje koraka i takmičenje sa prijateljima.

- **Danas** – prsten napretka prema dnevnom cilju, distanca, kalorije, grafikon nedelje, mini rang lista
- **Statistika** – Dan / Nedelja / Mesec / Godina: ukupno, prosek po danu, najbolji dan, dani sa ostvarenim ciljem
- **Kalendar** – mesečni prikaz sa brojem koraka za svaki dan (tap na dan = detalji)
- **Prijatelji** – rang lista (danas / nedelja / mesec), pretraga, zahtevi za prijateljstvo
- **Prijava** – email + lozinka, Google, Apple

Koraci se čitaju iz **Apple Health** (iOS) i **Health Connect** (Android), a dnevne sume se
sinhronizuju na **Supabase** (zbog takmičenja sa prijateljima).

## Tehnologije

Expo SDK 58 · React Native · TypeScript · Expo Router · Supabase · TanStack Query ·
Reanimated · `@kingstinct/react-native-healthkit` · `react-native-health-connect`

## Struktura

```
src/app/            ekrani (Expo Router)
  (auth)/           prijava i registracija
  (tabs)/           Danas, Statistika, Kalendar, Prijatelji
  profile.tsx       profil i dnevni cilj
src/health/         HealthKit (index.ios.ts), Health Connect (index.android.ts), demo podaci (index.ts, web)
src/sync/           slanje koraka na Supabase (+ pozadinski task)
src/hooks/          React Query hook-ovi
src/components/     UI komponente
supabase/migrations SQL šema (tabele, RLS, RPC)
```

## Podešavanje

### 1. Supabase (besplatno)

1. Napravi projekat na <https://supabase.com>.
2. **SQL Editor** → nalepi i pokreni, redom:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (tabele, prijatelji, rang lista)
   - [`supabase/migrations/0002_notifications.sql`](supabase/migrations/0002_notifications.sql) (obaveštenja o zahtevima za prijateljstvo)
3. **Project Settings → API** → kopiraj URL i `anon` ključ.
4. `cp .env.example .env` i upiši vrednosti.

### 2. Google prijava

1. Google Cloud Console → **Credentials** → napravi OAuth Client ID-jeve:
   - **Web** (njegov ID ide u `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` i u Supabase)
   - **iOS** (bundle ID `com.beatmysteps.app`) → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` i obrnuti ID u `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`
   - **Android** (paket `com.beatmysteps.app` + SHA-1 iz `npx eas-cli credentials`)
2. Supabase → **Authentication → Providers → Google** → uključi, unesi Web client ID i secret,
   a u *Authorized Client IDs* dodaj i iOS/Android ID-jeve.

### 3. Apple prijava (iOS)

1. Apple Developer → Identifiers → `com.beatmysteps.app` → uključi **Sign in with Apple** i **HealthKit**.
2. Supabase → **Authentication → Providers → Apple** → uključi i u *Client IDs* upiši `com.beatmysteps.app`.

### 4. Pokretanje

Health moduli ne rade u Expo Go, pa je potreban **development build**:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android   # ili ios
npm start                                                             # pa otvori app na telefonu
```

Na Android telefonu mora biti instaliran Health Connect (na Android 14+ je ugrađen).
Za iOS build nije potreban Mac (EAS gradi u cloudu), ali jeste Apple Developer nalog.

Brzi pregled UI-ja u browseru (demo koraci, ali i dalje treba Supabase za prijavu):

```bash
npx expo start --web
```

### Provere

```bash
npm run typecheck
npx expo-doctor
```

## Napomene

- Lični ekrani (Danas, Statistika, Kalendar) čitaju direktno iz Health aplikacije, pa rade offline i imaju celu istoriju.
- Rang lista koristi podatke sa Supabase-a; app šalje korake pri otvaranju, pri povratku u aplikaciju i periodično u pozadini.
- Za objavu na Google Play potrebno je prijaviti pristup Health Connect podacima u Play Console-u.
