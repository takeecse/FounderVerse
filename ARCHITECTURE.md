# FounderVerse stakeholder architecture

FounderVerse separates a member's **stakeholder personas** from their **platform access**.

## Stakeholder personas

Members choose one or more public personas on their profile. Each persona switches the workspace at `/dashboard`:

- **Founder**: manage ventures, review collaboration requests, and find teammates.
- **Investor**: discover ventures with funding needs and track introductions.
- **Collaborator**: find teams, track requests, and manage connections.
- **Mentor**: retained as a supported persona for existing accounts and verification.

The legacy `Collaborator/Seeker` and `Seeker` values are normalized to `Collaborator`. They remain accepted in stored documents during migration but are no longer offered as separate choices.

## Platform access

Platform access is stored separately in `User.systemRole` and is never editable through public profile endpoints:

- **user**: normal member access.
- **admin**: human moderation access at `/admin`; can review verification and reports, assign public personas, suspend/reactivate member accounts, and hide/republish startup listings.
- **system**: platform operator access at `/system`; can inspect service and platform health and grant/revoke human admin access. System accounts are configured through `SYSTEM_EMAILS` and cannot be created or promoted through public APIs.

Server middleware is authoritative for every protected operation. The client only controls navigation and workspace presentation.

## Configuration

Copy `server/.env.example` to `server/.env`, then set the database, JWT, and Firebase values. Add comma-separated trusted email addresses to `ADMIN_EMAILS` and `SYSTEM_EMAILS`. Operator accounts must sign in through verified Firebase authentication; password-based sessions cannot open operator APIs. System operators should be kept to a small number of trusted accounts.
