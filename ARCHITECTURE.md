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
- **admin**: human moderation access at `/admin`; can review verification and reports, handle startup appeals, assign public personas, suspend/reactivate member accounts, hide/republish or temporarily ban startup listings, and permanently delete listings. The admin button badge counts unread reports, verification tasks, and appeals separately for each administrator.
- **system**: platform operator access at `/system`; can inspect service and platform health and grant/revoke human admin access. System accounts are configured through `SYSTEM_EMAILS` and cannot be created or promoted through public APIs.

Server middleware is authoritative for every protected operation. The client only controls navigation and workspace presentation.

Members can submit reports and verification applications with image or document evidence. Report and verification uploads use Firebase Storage under the submitting Firebase account; deploy `storage.rules` with the Firebase CLI. Verification requests cover professional user roles and founder-owned startups, and approval adds the corresponding badge. A temporarily banned startup remains discoverable with its status displayed for 30 days. Founders can submit an appeal before the deadline; unresolved bans are removed by the server cleanup job after the deadline. Direct messages are blocked in both directions whenever either participant has blocked the other.

## Configuration

Copy `server/.env.example` to `server/.env`, then set the database, JWT, and Firebase values. Add comma-separated trusted email addresses to `ADMIN_EMAILS` and `SYSTEM_EMAILS`. Operator accounts must sign in through verified Firebase authentication; password-based sessions cannot open operator APIs. System operators should be kept to a small number of trusted accounts.
