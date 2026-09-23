# Interview Lab machine access

The ALVIRA Interview Lab has two separate access paths:

1. **Browser:** `/interview-lab` remains owner-session protected.
2. **Machine:** `/api/interview-lab/machine` is for explicitly authorized development tools such as Hermes.

Both paths call the same shared Lab server core. The machine path does not create a second interview engine.

## Security

The machine endpoint is disabled unless this secret is configured:

```
ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN=<high-entropy secret, minimum 32 characters>
```

Allowed client names default to only `hermes`. Override explicitly when needed:

```
ALVIRA_INTERVIEW_LAB_MACHINE_CLIENTS=hermes,codex
```

Machine callers send:

```
Authorization: Bearer <secret>
X-ALVIRA-Lab-Client: hermes
```

The token must never be committed, returned in responses, logged, or placed in chat history.

## Stateless contract

The caller owns the test conversation state and sends it on every turn.

```json
{
  "tier": "personal",
  "domainId": "background",
  "promptVersion": "lab-v2",
  "userName": "tk",
  "history": [],
  "baselineFocus": [
    {
      "label": "Constraints & boundaries",
      "classification": "conflicting",
      "rationale": "The tested tools returned different answers."
    }
  ]
}
```

`baselineFocus` is optional. When present, it is only an evidence-backed gap map for the
experimental Lab prompt; it is not approved Context and must not be treated as user fact.

A successful response returns the exact ALVIRA message plus Lab diagnostics.

The endpoint:

- does not write ALVIRA profiles;
- does not autosave interview drafts;
- does not update Build Brief state;
- does not mutate production Context;
- uses `Cache-Control: no-store`;
- rejects unknown clients;
- rejects requests larger than 256 KB.

## Capability discovery

Authenticated `GET /api/interview-lab/machine` returns the protocol version, supported tiers, prompt versions, and current interview domains.

Protocol version:

```
alvira-interview-lab/1
```

## Hermes

The Hermes adapter lives in Agent OS at:

```
adapters/hermes/alvira_interview_lab.py
```

Hermes must set:

```
ALVIRA_INTERVIEW_LAB_URL=https://<ALVIRA host>/api/interview-lab/machine
ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN=<same shared secret>
```

The adapter is intentionally stateless. Hermes keeps the Lab-specific conversation history in the current chat and resends it on each turn.
