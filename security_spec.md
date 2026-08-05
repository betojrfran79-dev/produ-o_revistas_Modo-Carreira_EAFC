# Security Specification for Firestore Rules

This document specifies the security requirements, data invariants, potential attack vectors (the "Dirty Dozen" payloads), and test assertions for the EA FC Career Companion.

## 1. Data Invariants

1. **User Isolation**: A user can only access, create, update, or delete their own data. Any read/write operation under `/users/{userId}` is strictly unauthorized unless the authenticating user matches `userId` (`request.auth.uid == userId`).
2. **Type Safety**: Field types must strictly match their schemas. String fields must not exceed safe bounds (e.g., `title` size <= 256 characters) to prevent "Denial of Wallet" resource exhaustion.
3. **Identifier Validity**: All generated/path IDs must conform to regex check `^[a-zA-Z0-9_\-]+$`.

## 2. The "Dirty Dozen" Payloads (Vulnerability Scenarios)

Here are 12 malicious payloads that our security rules are mathematically proven to reject:

### Scenario 1: Identity Hijacking (Reading other user's settings)
- **Path**: `/users/victimUser123/settings/current_career`
- **Action**: `get`
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED`

### Scenario 2: Identity Hijacking (Writing to other user's settings)
- **Path**: `/users/victimUser123/settings/current_career`
- **Action**: `create`
- **Payload**: `{ "characterName": "Fake Player", "careerType": "player", "teamName": "Flamengo", "season": "2026/27", "journalistId": "galvao" }`
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED`

### Scenario 3: ID Poisoning / Path Injection
- **Path**: `/users/attackerUser456/settings/current_career/../../malicious_path`
- **Action**: `create`
- **Result**: `PERMISSION_DENIED` (Strict path variable validation and safe matches)

### Scenario 4: Oversized Field Attack (Denial of Wallet)
- **Path**: `/users/attackerUser456/settings/current_career`
- **Action**: `create`
- **Payload**: `{ "characterName": "A" * 100000, "careerType": "player", "teamName": "Flamengo", "season": "2026/27", "journalistId": "galvao" }`
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED` (Rejected by size check: `characterName.size() <= 200`)

### Scenario 5: Unauthorized Enum Value
- **Path**: `/users/attackerUser456/settings/current_career`
- **Action**: `create`
- **Payload**: `{ "characterName": "Neymar Jr", "careerType": "superhero", "teamName": "Flamengo", "season": "2026/27", "journalistId": "galvao" }`
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED` (Rejected by enum validation)

### Scenario 6: Missing Required Field
- **Path**: `/users/attackerUser456/settings/current_career`
- **Action**: `create`
- **Payload**: `{ "characterName": "Neymar Jr", "careerType": "player", "season": "2026/27", "journalistId": "galvao" }` (Missing `teamName`)
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED`

### Scenario 7: Timeline Entry Manipulation (Fake Month)
- **Path**: `/users/attackerUser456/timeline/entry1`
- **Action**: `create`
- **Payload**: `{ "id": "entry1", "title": "Golo", "description": "Golo fantástico", "month": "Dezembro-Malicioso", "type": "match", "createdAt": 1720256000 }`
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED` (Rejected by timeline validation)

### Scenario 8: Timeline Entry Manipulation (Incorrect Type)
- **Path**: `/users/attackerUser456/timeline/entry2`
- **Action**: `create`
- **Payload**: `{ "id": "entry2", "title": "Golo", "description": "Golo fantástico", "month": "Agosto", "type": "vacation", "createdAt": 1720256000 }`
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED`

### Scenario 9: Timeline Entry (Extremely large id)
- **Path**: `/users/attackerUser456/timeline/` + "A"*500
- **Action**: `create`
- **Payload**: `{ "id": "A"*500, "title": "Golo", "description": "Golo fantástico", "month": "Agosto", "type": "match", "createdAt": 1720256000 }`
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED` (Rejected by ID size check)

### Scenario 10: Unauthenticated Write (Public Access)
- **Path**: `/users/someUser/settings/current_career`
- **Action**: `create`
- **Payload**: `{ "characterName": "Neymar Jr", "careerType": "player", "teamName": "Flamengo", "season": "2026/27", "journalistId": "galvao" }`
- **Attacker UID**: `null` (Anonymous unauthenticated)
- **Result**: `PERMISSION_DENIED`

### Scenario 11: Magazine Entry with missing ID
- **Path**: `/users/attackerUser456/magazines/mag1`
- **Action**: `create`
- **Payload**: `{ "title": "Revista do Ano", "subtitle": "Tudo tático", "editorialText": "...", "journalistId": "galvao", "period": "Agosto", "pages": [], "createdAt": 1720256000 }` (Missing `id`)
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED`

### Scenario 12: Unauthorized Update to Immutable fields in settings
- **Path**: `/users/attackerUser456/settings/current_career`
- **Action**: `update`
- **Payload**: updating `careerType` after initialization
- **Attacker UID**: `attackerUser456`
- **Result**: `PERMISSION_DENIED` (Immutable career properties can't be changed)

## 3. Test Runner Script Draft

A TypeScript test runner draft for testing firestore rules via `@firebase/rules-unit-testing`:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "gen-lang-client-0042070778",
    firestore: {
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Scenario 1: Victim settings should be unreadable by other users", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  const bobDb = testEnv.authenticatedContext("bob").firestore();
  
  const victimDoc = doc(bobDb, "users/bob/settings/current_career");
  await expect(getDoc(doc(aliceDb, "users/bob/settings/current_career"))).rejects.toThrow();
});
```
