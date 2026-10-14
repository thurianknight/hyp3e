# CHANGELOG

## Unreleased

- Preserve permanent effects, modern durations, expiry events, and remaining-round flags during effect migration. Await writes and leave failed migrations eligible for retry.
- Run shared migrations only on the active GM, restore compendium locks after failures, and check effects when a previously migrated v13 world upgrades to v14.

See the pull request history in GitHub: https://github.com/thurianknight/hyp3e/pulls?q=is%3Apr+is%3Aclosed
