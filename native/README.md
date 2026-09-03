# ALVIRA Native 0.1

This directory is an intentionally isolated Capacitor shell for ALVIRA.

## Why this exists

Native 0.1 proves the lowest-risk mobile contract first:

1. install ALVIRA on a physical device;
2. open the existing production ALVIRA `/app` origin inside the native container;
3. sign in with an existing ALVIRA account;
4. verify that the same Context is available as on the web;
5. confirm that the existing web deployment, Stripe billing, Bridge, Context, Reflect, uploads, and entitlement rails are unchanged.

The remote origin in `capacitor.config.ts` is a **temporary internal proving harness**, not the final App Store architecture. It deliberately avoids modifying ALVIRA's TanStack Start server/runtime while we validate the native container.

## Vercel safety

The branch `feat/alvira-native-shell` is disabled for Vercel Git deployments through the branch-local `vercel.json` configuration. Do not remove that guard while this branch is being used for native scaffolding.

No production deployment is required to bootstrap or open the native projects.

## Bootstrap

From this directory:

```bash
bun run bootstrap
```

That installs Capacitor 8.5.1, generates the iOS and Android projects, and syncs the local fallback assets/configuration.

Then:

```bash
bun run doctor
bun run open:ios
# or
bun run open:android
```

## App identity

- App name: `ALVIRA`
- Bundle/application ID: `com.alviratech.alvira`
- Initial launch target: `https://alviratech.vercel.app/app`

The bundle ID can be changed before store registration if Apple/Google availability requires it.

## Native 0.1 done-when

- [ ] iOS project generated successfully
- [ ] Android project generated successfully
- [ ] iOS simulator/device launches ALVIRA
- [ ] Android emulator/device launches ALVIRA
- [ ] existing ALVIRA user can sign in
- [ ] the same user Context is visible on web and native
- [ ] Context and Reflect remain usable
- [ ] no native-branch Vercel deployment was created
- [ ] current production deployment remains unchanged

## Explicit non-goals for 0.1

Do not add camera, voice capture, push notifications, biometrics, RevenueCat, store billing, offline synchronization, or a second ALVIRA data model in this milestone.

Those come only after the account/context identity proof is green.
