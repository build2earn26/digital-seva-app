# AGENTS.md

This file is read by Hermes when working in this repo.

## Branches
- `main` is protected.
- Work in feature branches named like `feat/<short-name>` or `fix/<short-name>`.

## Commits
- `feat:` new feature
- `fix:` bug fix
- `docs:` docs only
- `refactor:` behavior-preserving change
- `chore:` tooling, deps, CI

## Code rules
- Prefer the stdlib before adding dependencies.
- Keep secrets in environment variables only.
- Do not add client-side API keys or embedded credentials.
- Validate all external inputs.
- Use parameterized queries for database access.

## Delivery
- Prompts and text deliverables stay in chat.
- Code outputs go into repo files.
- `.md` and `.txt` scrape outputs stay in chat unless the user asks for files.
