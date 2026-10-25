# Security Specification for EduJeopardy

## Data Invariants
1. A Game must have valid string title (max 100 chars) and structured categories array.
2. A GameSession must have a 6-digit PIN string and valid status enum ('lobby', 'active', 'question_open', 'question_buzzed', 'question_revealed', 'finished').
3. Active questions can only be updated with valid fields, and scores can only be numbers.
4. Document IDs must be alphanumeric strings safe against path injection.
5. Leaderboard entries must have bounded string names and valid non-negative numbers for gamesPlayed, gamesWon, and totalScore.

## The Dirty Dozen Malicious Payloads

1. **Junk Path ID Attack**: Document ID with invalid characters `../../etc/passwd` attempting path traversal.
2. **Denial of Wallet Title Attack**: Game with 500,000 character title attempting document bloat.
3. **Invalid Game Status Injection**: Game session updated with unknown status `DROP TABLE games;`.
4. **Negative Score Exploit**: Updating team score to a non-numeric string or corrupting session object.
5. **Leaderboard Overflow Attack**: Submitting 10MB JSON payload to leaderboards collection.
6. **Ghost Field Poisoning**: Injecting unauthorized `isAdmin: true` into game document.
7. **Buzzer Hijack with Invalid Type**: Submitting a boolean instead of an object for `buzzedTeam`.
8. **Categories Format Mutation**: Overwriting categories array with an integer to break client renderers.
9. **PIN Spoofing Attack**: Session with PIN exceeding 20 characters.
10. **Game Board Deletion Attack**: Malicious client attempting bulk deletion of other teachers' games.
11. **Negative Games Count**: Submitting negative values for gamesWon or gamesPlayed.
12. **Malformed Timer Payload**: Setting remainingSeconds to arbitrary executable text or malicious script.

## Security Rules Enforcement Strategy
- All document IDs are validated with `isValidId(id)`: length <= 128 and matching regex `^[a-zA-Z0-9_\\-]+$`.
- Catch-all default deny on `{document=**}`.
- Specific collection match blocks with strict typing, length restrictions, and action-based updates.
