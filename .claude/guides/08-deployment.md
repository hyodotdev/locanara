# Distribution and Deployment Boundary

## Agent Boundary

Distribution is maintainer-owned. AI agents may inspect workflows and prepare
local fixes when requested, but must never publish, deploy, tag, create a
release, delete/replace a release, or trigger release/deploy automation.

## Distribution Surfaces

| Surface | Coordinate |
| --- | --- |
| Apple | `Locanara` through SPM/CocoaPods |
| Android | `com.locanara:locanara` through Maven Central |
| Web | `locanara` through npm |
| Expo | `expo-ondevice-ai` through npm |
| React Native | `react-native-ondevice-ai` through npm |
| Flutter | `flutter_ondevice_ai` through pub.dev |

Read current versions from `locanara-versions.json`; do not embed example
versions in workflow guidance.

## Workflow Audit Checklist

When reviewing `.github/workflows/release-*.yml` or `deploy-site.yml`, check:

- explicit branch/ref guard;
- protected environment and least-privilege permissions;
- concurrency to prevent overlapping releases;
- verification before version mutation or publication;
- version synchronization for the actual package manifest/runtime constants;
- no destructive `current` flow that deletes an existing tag/release;
- immutable artifact/checksum handling;
- deployment only from the intended production branch.

Do not print, request, or expose registry/deployment secrets.

## SPM Notes

The root `Package.swift` is the consumer entry point and maps sources under
`packages/apple`. Apple release tags must remain semver-compatible for SPM, but
tag creation is maintainer-only. The package deployment target and Foundation
Models runtime availability are different constraints: local engines support
older package targets, while Foundation Models requires the newer OS API.

## Verification Before Maintainer Handoff

Run `/verify-all` for affected surfaces, check version drift, inspect generated
outputs, and report any real-device-only rows. Stop before the first external
publication or deployment action.
