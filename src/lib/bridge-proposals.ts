import { randomUUID } from "node:crypto";
import { getDb } from "~/db";

let proposalSchemaReady: Promise<void> | null = null;

export type BridgeContextProposal = {
  id: string;
  user_id: string;
  profile_id: string;
  connection_id: string | null;
  client_id: string;
  statement: string;
  rationale: string | null;
  supersedes: string[];
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

export async function ensureBridgeProposalSchema() {
  if (proposalSchemaReady) return proposalSchemaReady;
  proposalSchemaReady = (async () => {
    const db = getDb();
    await db.query(`
      CREATE TABLE IF NOT EXISTS bridge_context_proposals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        connection_id TEXT,
        client_id TEXT NOT NULL,
        statement TEXT NOT NULL,
        rationale TEXT,
        supersedes_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ,
        CONSTRAINT bridge_context_proposals_status_chk CHECK (status IN ('pending','approved','rejected'))
      )
    `);
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_context_proposals_user_status ON bridge_context_proposals(user_id, status, created_at DESC)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_context_proposals_profile ON bridge_context_proposals(profile_id, created_at DESC)");
  })().catch((error) => {
    proposalSchemaReady = null;
    throw error;
  });
  return proposalSchemaReady;
}

function parseSupersedes(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function mapProposal(row: any): BridgeContextProposal {
  return {
    id: row.id,
    user_id: row.user_id,
    profile_id: row.profile_id,
    connection_id: row.connection_id ?? null,
    client_id: row.client_id,
    statement: row.statement,
    rationale: row.rationale ?? null,
    supersedes: parseSupersedes(row.supersedes_json || "[]"),
    status: row.status,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at ?? null,
  };
}

export async function createBridgeContextProposal(input: {
  userId: string;
  profileId: string;
  connectionId?: string | null;
  clientId: string;
  statement: string;
  rationale?: string | null;
  supersedes?: string[];
}) {
  await ensureBridgeProposalSchema();
  const statement = input.statement.trim();
  if (!statement) throw new Error("A proposed Context update needs a statement.");
  if (statement.length > 4000) throw new Error("Proposed Context update is too long.");

  const profile = (await getDb().query(
    "SELECT id FROM profiles WHERE id = $1 AND user_id = $2",
    [input.profileId, input.userId],
  ))[0] as { id: string } | undefined;
  if (!profile) throw new Error("The authorized Context is not available.");

  const id = `bcp_${randomUUID()}`;
  const supersedes = (input.supersedes || []).map((value) => value.trim()).filter(Boolean).slice(0, 20);
  await getDb().query(
    `INSERT INTO bridge_context_proposals
      (id, user_id, profile_id, connection_id, client_id, statement, rationale, supersedes_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, input.userId, input.profileId, input.connectionId || null, input.clientId, statement, input.rationale?.trim() || null, JSON.stringify(supersedes)],
  );
  return { id, status: "pending" as const };
}

export async function listBridgeContextProposalsForUser(userId: string) {
  await ensureBridgeProposalSchema();
  const rows = await getDb().query(
    `SELECT p.*, pr.topic AS profile_topic
       FROM bridge_context_proposals p
       JOIN profiles pr ON pr.id = p.profile_id AND pr.user_id = p.user_id
      WHERE p.user_id = $1
      ORDER BY CASE p.status WHEN 'pending' THEN 0 ELSE 1 END, p.created_at DESC`,
    [userId],
  ) as any[];
  return rows.map((row) => ({ ...mapProposal(row), profile_topic: row.profile_topic as string }));
}

export async function reviewBridgeContextProposal(input: {
  userId: string;
  proposalId: string;
  action: "approve" | "reject";
}) {
  await ensureBridgeProposalSchema();
  const db = getDb();
  const proposalRow = (await db.query(
    `SELECT * FROM bridge_context_proposals
      WHERE id = $1 AND user_id = $2 AND status = 'pending'
      FOR UPDATE`,
    [input.proposalId, input.userId],
  ))[0] as any | undefined;
  if (!proposalRow) throw new Error("Pending proposal not found.");

  if (input.action === "reject") {
    await db.query(
      "UPDATE bridge_context_proposals SET status = 'rejected', reviewed_at = NOW() WHERE id = $1 AND user_id = $2",
      [input.proposalId, input.userId],
    );
    return { status: "rejected" as const };
  }

  const profile = (await db.query(
    "SELECT id, state_json FROM profiles WHERE id = $1 AND user_id = $2 FOR UPDATE",
    [proposalRow.profile_id, input.userId],
  ))[0] as { id: string; state_json: string } | undefined;
  if (!profile) throw new Error("Context not found.");

  let state: any = {};
  try { state = JSON.parse(profile.state_json); } catch { state = {}; }
  if (!state || typeof state !== "object" || Array.isArray(state)) state = {};
  if (!state.domains || typeof state.domains !== "object" || Array.isArray(state.domains)) state.domains = {};

  const existing = state.domains.updates && typeof state.domains.updates === "object" ? state.domains.updates : {};
  const answers = Array.isArray(existing.answers) ? existing.answers.filter((item: unknown) => typeof item === "string") : [];
  const supersedes = parseSupersedes(proposalRow.supersedes_json || "[]");
  const provenance = `Bridge proposal ${proposalRow.id} from ${proposalRow.client_id} on ${new Date(proposalRow.created_at).toISOString().slice(0, 10)}`;
  const answer = [
    proposalRow.statement,
    supersedes.length ? `Supersedes or materially changes: ${supersedes.join("; ")}` : "",
    `Source: ${provenance}`,
  ].filter(Boolean).join("\n");

  state.domains.updates = {
    ...existing,
    answers: [...answers, answer],
    confidence: Math.max(Number(existing.confidence || 0), 1),
    covered: true,
  };

  await db.query(
    "UPDATE profiles SET state_json = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
    [JSON.stringify(state), proposalRow.profile_id, input.userId],
  );
  await db.query(
    "UPDATE bridge_context_proposals SET status = 'approved', reviewed_at = NOW() WHERE id = $1 AND user_id = $2",
    [input.proposalId, input.userId],
  );
  return { status: "approved" as const, profileId: proposalRow.profile_id };
}
