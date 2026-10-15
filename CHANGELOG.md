# CHANGELOG

## Unreleased

- Build release ZIPs from fresh staging so obsolete files such as `template.json`
  cannot survive from a previous release. hyp3e already defines its Actor and
  Item types in `system.json` and registers their data models for Foundry v13/v14.
- Add `npm run release:build` for local packaging without tagging or publishing,
  and `npm run test:packaging` for release regression checks.
- If an existing 4.5.0 installation shows the `template.json` deprecation warning,
  stop Foundry, move only `Data/systems/hyp3e/template.json` outside the installed
  package, and restart the server. Keep `system.json` and the `templates/` folder.
  The originally published 4.5.0 ZIP contains this obsolete file, so reinstalling
  that archive restores it.

See the pull request history in GitHub: https://github.com/thurianknight/hyp3e/pulls?q=is%3Apr+is%3Aclosed
