# Codex Task — Visaflow Apply Now → Persistent Visa Application Draft

## Objective

Implement the Visaflow visa-application lifecycle so that clicking **Apply Now** from a visa details page creates or resumes a persistent application draft, then redirects the user to the application flow. The selected visa/destination must already be populated in Step 1.

The current application steps are:

```ts
const STEPS = [
  { id: 1, label: "Visa Type", icon: Globe },
  { id: 2, label: "Personal", icon: User },
  { id: 3, label: "Travel", icon: MapPin },
  { id: 4, label: "Documents", icon: FileText },
  { id: 5, label: "Review", icon: CreditCard },
];
```

## Critical architecture decision

Do **not** wait until Step 3 to create the draft.

The application record must be created/retrieved when the user clicks **Apply Now**, before Step 1 is rendered.

The URL must identify the application:

```text
/dashboard/applications/:applicationId
```

Do not use a destination string as the persistent URL identity.

A temporary entry URL may contain:

```text
/dashboard/applications/new?visaId=<visaId>
```

but after the backend creates/resumes the application, redirect to:

```text
/dashboard/applications/<applicationId>
```

The database is the source of truth for the selected visa.

## First inspect the repository

This is a Turborepo monorepo. Before changing anything:

1. Inspect all workspace packages/apps.
2. Identify the Next.js frontend application.
3. Identify the NestJS backend.
4. Identify shared packages for database access, types, validation, API clients, UI, and utilities.
5. Inspect the existing Prisma schema/migrations and existing Application/Visa/User models.
6. Inspect the current application step components/routes.
7. Inspect how authenticated user identity is obtained on both frontend and backend.
8. Inspect the current Step 3 draft creation logic and remove/rework it rather than creating a second competing flow.
9. Inspect existing API conventions, error handling, DTOs, guards, and React Query/fetch patterns.
10. Do not introduce a second API/client architecture if one already exists.

Do not blindly overwrite existing code.

## Desired user flow

### Case 1 — User clicks Apply Now for France

```text
Explore Visas
  ↓
France Visa Details
  ↓
Apply Now
  ↓
POST /applications
{
  visaId: "<france-visa-id>"
}
  ↓
Backend creates DRAFT
  ↓
Return:
{
  applicationId: "<app-id>"
}
  ↓
Frontend:
router.push("/dashboard/applications/<app-id>")
  ↓
Step 1
```

Step 1 must show France and the exact visa selected.

### Case 2 — User already has a draft for that visa

If the authenticated user already has an active draft for the same visa, do not create duplicate drafts.

Use a server-side uniqueness/idempotency rule such as:

```text
userId + visaId + active draft status
```

Return the existing application.

Frontend then redirects to that application's route.

The user can resume from its `currentStep`.

### Case 3 — User has a France draft and clicks Germany

Create a separate Germany application.

Do not silently mutate the France draft merely because another Apply Now button was clicked.

Example:

```text
app_123 → France Tourist Visa → DRAFT → Step 3
app_456 → Germany Tourist Visa → DRAFT → Step 1
```

unless the user explicitly changes the visa inside the existing application.

## Application model/state

Adapt to the existing schema rather than blindly creating duplicate models.

The application needs, directly or through the existing schema:

```text
id
userId
visaId
status
currentStep
createdAt
updatedAt
```

Use the existing status enum if available. At minimum distinguish:

```text
DRAFT
SUBMITTED
IN_REVIEW
APPROVED
REJECTED
CANCELLED
```

Do not add duplicate fields if the project already models them.

## Backend endpoints

Use the project's existing REST/API conventions. The logical API should support:

### Create or resume application

```http
POST /applications
```

Body:

```json
{
  "visaId": "<visa-id>"
}
```

Behavior:

1. Authenticate user.
2. Validate the visa exists.
3. Validate the visa is active/applicable.
4. Find an existing active draft for this user + visa.
5. If found, return it.
6. Otherwise create a new DRAFT with `currentStep = 1`.
7. Return the application ID and current step.
8. Never trust `userId` from the request body.

Example response:

```json
{
  "id": "app_123",
  "status": "DRAFT",
  "currentStep": 1,
  "visa": {
    "id": "visa_france",
    "destination": "France",
    "name": "Schengen Tourist Visa"
  }
}
```

### Get application

```http
GET /applications/:applicationId
```

Only the owner or an authorized admin may access it.

Return the application and the selected visa data required by Step 1.

### Update application

Use the existing endpoint convention. It should support partial updates to each step and persist `currentStep`.

Do not allow a client to arbitrarily set privileged statuses such as APPROVED or IN_REVIEW.

### Change selected visa

If the current Step 1 UI allows the user to change the visa, create a dedicated operation or carefully validate the generic update:

```http
PATCH /applications/:applicationId/visa
```

Body:

```json
{
  "visaId": "<new-visa-id>"
}
```

The backend must:

1. Verify ownership.
2. Verify the application is still a DRAFT.
3. Verify the new visa exists and is active.
4. Update `visaId`.
5. Recalculate/invalidate visa-specific requirements, document requirements, price, and processing data as appropriate.
6. Preserve generic personal/contact data unless business rules say otherwise.
7. Return the updated application and a clear indication of affected sections.

Never let the frontend decide authoritative pricing or visa requirements.

## Step behavior

### Step 1 — Visa Type

Load the application by `applicationId`.

Do not search for a draft by destination.

The selected visa should be populated from:

```text
application.visa
```

The user may change it if the product allows.

If they change it, persist the new visa to the same draft.

### Step 2 — Personal

Load/save against the same application ID.

### Step 3 — Travel

This step must no longer create the initial draft.

Remove the old:

```text
find draft by visaId
if not found create draft
```

logic.

Step 3 should only load/update the already-existing application.

### Step 4 — Documents

Associate uploaded documents with the application ID and preserve the existing document-storage architecture. Do not put private document files directly into public URLs.

### Step 5 — Review

Load all application data from the backend and show the authoritative visa, pricing, requirements, travel data, documents, and personal data.

Before final submission, revalidate server-side.

## Resume behavior

The application must support:

```text
Apply Now
→ Step 1
→ Step 2
→ Step 3
→ user closes browser
→ returns later
→ My Applications
→ Continue
→ /dashboard/applications/<applicationId>
→ resume from currentStep
```

The application route must not rely on transient React state.

Persist meaningful step progress to the backend.

## Navigation and URL rules

Use:

```text
/dashboard/explore/visas/:visaId
```

for the visa detail page.

Apply Now may initially hit:

```text
/dashboard/applications/new?visaId=:visaId
```

but this route should call the backend and redirect to:

```text
/dashboard/applications/:applicationId
```

Alternatively, the visa details component may directly call the create/resume API and then navigate to the application route.

Do not put sensitive personal/application data into query parameters.

Do not use:

```text
/application?destination=France
```

as the application's long-term identity.

## Concurrency/idempotency

Protect against double clicks.

Frontend:

- disable Apply Now while creating
- show loading state
- prevent duplicate requests

Backend:

- enforce a database-level uniqueness strategy where practical
- handle concurrent create requests safely
- if two requests race, return the same active draft rather than creating two drafts

Use a transaction/upsert strategy appropriate for the project's Prisma/PostgreSQL setup.

## Authorization

Every application operation must be scoped to the authenticated user.

Never accept:

```json
{
  "userId": "..."
}
```

from the browser as the authority.

The backend derives user identity from the authenticated session/token.

For:

```text GET /applications/:id
PATCH /applications/:id
PATCH /applications/:id/visa
POST /applications/:id/...
```

verify ownership or admin authorization.

## Validation

Use the project's existing validation library and DTO conventions.

Validate:

- visaId
- applicationId
- step payloads
- allowed status transitions
- allowed currentStep values
- ownership
- visa availability

Return consistent HTTP errors according to the existing backend conventions.

## Frontend requirements

The application UI should:

1. Receive/load the application by application ID.
2. Populate Step 1 from the backend-selected visa.
3. Display a loading skeleton while loading.
4. Handle not-found/unauthorized states.
5. Handle expired/closed applications.
6. Persist step changes.
7. Preserve data while navigating between steps.
8. Prevent accidental duplicate application creation.
9. Show a confirmation before changing an existing visa if dependent data may be affected.
10. Refresh authoritative application data after a visa change.

## Change-visa UX

If the user changes France → Germany:

```text
Current application:
France Tourist Visa
```

Show a warning:

```text
Change visa?

Changing your visa may affect:
• visa requirements
• required documents
• processing time
• application fees

Your personal information will be kept.

Cancel    Change Visa
```

After confirmation, call the backend and update the application.

If documents/travel data are now invalid, mark them for review rather than blindly deleting user data.

## Database safety

Do not create destructive migrations unless absolutely necessary.

Before changing Prisma schema:

1. Inspect existing schema.
2. Reuse existing Application/Visa relationships.
3. Add only missing fields/indexes/constraints.
4. Generate a proper migration.
5. Do not reset the database.
6. Do not delete existing application records.
7. Make the migration backward compatible where possible.

If a unique partial index is required for active drafts, verify the Prisma/PostgreSQL project's migration capabilities and use an appropriate SQL migration when Prisma cannot express the exact constraint.

## Tests

Add/update tests for:

### Backend

- create new draft
- resume existing draft
- duplicate concurrent Apply Now requests
- invalid visa
- inactive visa
- unauthorized application access
- owner can access own draft
- Step 3 does not create drafts
- change visa on DRAFT
- reject visa change on submitted/closed application
- currentStep persistence
- valid step updates
- invalid status transitions

### Frontend

- Apply Now loading state
- successful redirect
- existing draft redirect
- Step 1 prefilled from application
- visa-change confirmation
- error state
- resume from saved currentStep

## Acceptance criteria

The implementation is complete only when:

- Clicking Apply Now from a visa creates or resumes a DRAFT.
- The response contains the application ID.
- The browser redirects to `/dashboard/applications/:applicationId`.
- Step 1 automatically displays the selected visa/destination.
- Step 3 no longer creates the initial draft.
- Returning users can resume the same application.
- Clicking Apply Now for another visa creates/opens a separate application.
- Changing the visa inside a DRAFT updates the existing application after confirmation.
- The backend remains the source of truth.
- No sensitive data is passed through URL query parameters.
- Application ownership is enforced server-side.
- Duplicate drafts are prevented.
- Existing PayPal, internal wallet, Reown/Pay-with-Wallet, document storage, and other Visaflow functionality is not broken.

## Deliverables

After implementation:

1. List every file changed.
2. Explain the API flow.
3. Explain any Prisma/schema migration.
4. Explain how duplicate draft creation is prevented.
5. Explain how Step 1 gets the selected visa.
6. Explain how resume works.
7. Run the relevant lint/typecheck/tests/build commands used by the repository.
8. Report any unrelated existing failures separately.
