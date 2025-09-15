## [Unreleased]

### Removed
- Pruned legacy archived React components and scripts (`archive/`, `backup/obsolete/SimulatedBackend.js`).
- Removed obsolete API test harness `api-endpoint-test.js` (superseded by shell + Playwright tests).
- Removed unused coverage helper `scripts/coverage-summary.mjs`.
- Removed untracked debug helpers (`test_signalr.js`, `public/test-backend.js`).

### Changed
- ESLint flat config now owns ignore patterns; deprecated `.eslintignore` scheduled for deletion in follow-up commit (auto-added transiently by git operations but will be removed when config stabilizes).

