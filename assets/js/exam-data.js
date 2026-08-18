/* =============================================================
   CCAR-F Study Hub — mock exam item bank
   60 scenario-based questions, weighted to the published blueprint.
   Original items written to the exam blueprint and documented product
   behaviour. Not recalled or leaked exam content.

   NOTE: this file is data. Option letters were balanced so no single
   letter dominates the answer key; do not re-sort options by hand.

   Option LENGTH is balanced too: within every question the four options
   are written to a similar length, and the correct option is deliberately
   never the longest and never the shortest. Length must not leak the key —
   if you edit an option, re-check the whole set before committing.
   ============================================================= */

var DOMAINS = {
  "AAO": {
    "name": "Agentic Architecture & Orchestration",
    "weight": 27
  },
  "CCW": {
    "name": "Claude Code Configuration & Workflows",
    "weight": 20
  },
  "PESO": {
    "name": "Prompt Engineering & Structured Output",
    "weight": 20
  },
  "TDM": {
    "name": "Tool Design & MCP Integration",
    "weight": 18
  },
  "CMR": {
    "name": "Context Management & Reliability",
    "weight": 15
  }
};

var SCENARIOS = {
  S1: {
    title: "Meridian Retail Bank — customer support agent",
    text: "Meridian runs a Claude-powered support agent across chat and email for 3.4 million retail customers. It handles balance enquiries, disputed transactions, card blocks and refunds. The agent has tools for identity verification, account lookup, transaction history, card control and refunds, and an <code>escalate_to_human</code> tool. Agents may auto-approve refunds up to $50; anything above requires a tier-2 approver. Regulators require that every customer contact reaches a documented outcome. The orchestration layer is a Node service wrapping the Messages API."
  },
  S2: {
    title: "Northwind Commerce — multi-agent order operations",
    text: "Northwind is a marketplace with 40,000 sellers. A coordinator agent decomposes customer requests (\"where is my order\", \"this arrived damaged\", \"cancel and reorder in blue\") and dispatches specialised subagents: an <em>order</em> agent, a <em>logistics</em> agent, a <em>returns</em> agent and a <em>seller-policy</em> agent. Each subagent has its own tool set and returns a summary to the coordinator, which composes the customer-facing reply. Peak load is 12,000 concurrent sessions."
  },
  S3: {
    title: "Helix Cloud — incident support agent",
    text: "Helix runs an incident-response agent that joins every PagerDuty incident. It queries metrics, reads recent deploys, greps logs, checks dependency health and drafts a status update. It can roll back a deploy only for services tagged <code>auto_rollback: true</code>; everything else requires a human. SLAs are 15 minutes to first meaningful update for SEV-1. Incidents frequently run for hours, so sessions are long."
  },
  S4: {
    title: "Vantage IT Services — managed service desk",
    text: "Vantage operates an IT service desk for 90 corporate clients. Its agent resolves password resets, access requests, VPN faults and software installs across each client tenant. Tools include a knowledge-base search, a directory lookup, an account-status check, an unlock/reset pair, an asset lookup and a ticketing integration exposed over MCP. Tool catalogues differ per client tenant, and several tools have overlapping names and purposes."
  },
  S5: {
    title: "Atlas Insurance — document extraction pipeline",
    text: "Atlas extracts structured data from claim forms, invoices, medical reports and policy schedules arriving as email attachments and scans from 600 broker partners. Layouts vary widely. Output feeds a claims-adjudication system that pays money, so extraction errors are expensive. A human review queue exists but is the bottleneck; the goal is to shrink it without increasing error rates."
  },
  S6: {
    title: "Corvus Engineering — Claude Code rollout",
    text: "Corvus is rolling out Claude Code to 400 engineers across a monorepo containing payments, identity and a public API. Security requires that certain files are never read and certain commands never run. Platform engineering wants formatting, linting and tests enforced consistently. There is a GitHub Actions pipeline that should run an automated review on every pull request. Different teams have different conventions."
  }
};

var QUESTIONS = [
{
  n: 1, domain: "AAO", topic: "Topic 1", sc: "S1", type: "multi",
  stem: "Post-launch analysis shows 2.8% of Meridian sessions end with no recorded outcome: no resolution, no escalation, no ticket. Logs show these sessions simply stop. Which TWO changes give the strongest guarantee that every session reaches a terminal state?",
  opts: {
    A: "Add a <code>default</code> branch to <code>stop_reason</code> handling that escalates on unrecognised values, and escalate when the turn loop falls through.",
    B: "Raise <code>MAX_TURNS</code> from 10 to 40 so that long sessions have enough iterations to finish before the loop gives up on them.",
    C: "Add a line to the system prompt telling the agent it must always resolve the issue or call <code>escalate_to_human</code> before ending its turn.",
    D: "Persist session state durably and run an out-of-band sweeper that escalates any session left non-terminal past its SLA."
  },
  correct: ["A","D"],
  rule: "The terminal-state guarantee is an orchestration-layer property. It requires (1) exhaustive, in-process handling of every way the loop can exit — including unknown stop reasons and loop fall-through — and (2) an out-of-band mechanism for the exits that no in-process code can observe, such as a pod being killed mid-session. Together they close both the logical and the infrastructural gaps.",
  why: {
    A: "Correct. Unknown stop reasons and turn-budget exhaustion are two of the commonest silent-drop paths. A <code>default</code> branch makes unknown states fail into escalation rather than into silence, and handling fall-through converts \"the loop ended\" into a recorded decision.",
    B: "Wrong. The turn budget is not the failure; the <em>unhandled</em> exhaustion of it is. Raising 10 to 40 moves the cliff, quadruples cost and latency for sessions that were going to fail anyway, and still terminates silently when 40 is reached.",
    C: "Wrong. This is prompt-based enforcement of a guarantee. It shapes behaviour without guaranteeing it, and it fails in exactly the sessions that have already gone wrong — the truncated, refused and crashed ones, where the model never gets another turn to obey the instruction.",
    D: "Correct. <code>try/finally</code> is in-process and does not run on <code>SIGKILL</code>, a node eviction or a deploy restart. Only durable state plus an external reaper covers those paths — and at 12,000 concurrent sessions they happen daily."
  }
},
{
  n: 2, domain: "AAO", topic: "Topic 1", sc: "S1",
  stem: "A customer disputes a $32 charge. The transcript ends with the agent saying \"I have processed your refund of $32, you will see it in 3-5 days.\" The API returned <code>stop_reason: end_turn</code> and the orchestrator closed the session as RESOLVED. No refund exists in the payments system. What is the architectural defect?",
  opts: {
    A: "The session should have used <code>tool_choice: {\"type\":\"any\"}</code> to force a tool call on every turn of the loop.",
    B: "The refund tool silently failed and returned an empty result rather than an error the orchestrator could have acted on.",
    C: "The agent needed a lower temperature setting so that it would not fabricate outcomes that it had not performed.",
    D: "The orchestrator treats <code>end_turn</code> as proof of resolution rather than verifying against the system of record."
  },
  correct: ["D"],
  rule: "<code>end_turn</code> means the model finished generating — nothing more. It fires identically for a real resolution and for a fabricated one. Resolution is a property of the world, not of the transcript, so a correct orchestrator gates success on a verification step against the system of record before writing RESOLVED.",
  why: {
    A: "Wrong. Forcing a tool call each turn does not ensure the <em>right</em> tool ran or that it succeeded — and it would produce spurious calls on conversational turns. It addresses neither verification nor the terminal-state record.",
    B: "Plausible but not established, and not the architectural defect. Even if the tool had errored correctly, an orchestrator that trusts <code>end_turn</code> would still close the session as resolved. Fixing tool error reporting is worth doing; it does not close this hole.",
    C: "Wrong. Temperature is not the mechanism here, and the exam consistently treats sampling-parameter tweaks as a probabilistic patch over a structural gap. The session would still close as RESOLVED whenever the model happened to phrase a non-action confidently.",
    D: "Correct. The defect is the missing verification gate. On <code>end_turn</code> the orchestrator must ask the payments system whether a refund row exists for this session, and escalate with <code>NO_TERMINAL_ACTION</code> if it does not."
  }
},
{
  n: 3, domain: "AAO", topic: "Topic 1", sc: "S3",
  stem: "During a SEV-1, the incident agent produced a status update that ended mid-sentence. The pipeline published it to the customer status page. The API response carried <code>stop_reason: max_tokens</code>. What should the orchestrator have done?",
  opts: {
    A: "Published the update anyway, on the basis that partial information during a live incident beats nothing at all.",
    B: "Reduced the size of the system prompt so that more of the token budget was left available for the model's output.",
    C: "Treated the response as incomplete — continued generation or escalated — and kept truncated output out of terminal actions.",
    D: "Retried the identical request unchanged, on the basis that <code>max_tokens</code> truncation is a transient condition that soon clears."
  },
  correct: ["C"],
  rule: "<code>max_tokens</code> is a truncation signal, not a completion signal. Any pipeline that parses or publishes output received with <code>max_tokens</code> is treating an incomplete artefact as final. Correct handling is to continue the generation or route to a human — the choice depends on the SLA, but publishing is never it.",
  why: {
    A: "Wrong, and deliberately tempting because incident-response instincts favour speed. A truncated public status update on a SEV-1 can state a cause or an impact incorrectly and mid-clause, which is worse than a short accurate holding message.",
    B: "A reasonable capacity tuning, but not the handling defect. Even with a larger budget, some responses will truncate, and the pipeline would publish those too. The fix must be in how the stop reason is handled.",
    C: "Correct. This is the general rule: only <code>end_turn</code> (plus verification) is a success path. Everything else maps to continue-or-escalate.",
    D: "Wrong. <code>max_tokens</code> is deterministic given the same input and budget, not transient. An identical retry produces an identical truncation and burns SLA time."
  }
},
{
  n: 4, domain: "AAO", topic: "Topic 1", sc: "S2",
  stem: "A customer asks Northwind's coordinator to \"sort out my damaged order — I want a replacement, and tell the seller.\" The coordinator dispatches the returns agent and the logistics agent. Both complete successfully and report clean results, but the seller is never notified and the customer complains. Where is the defect?",
  opts: {
    A: "In the coordinator's task decomposition, which failed to scope a subtask covering the seller notification.",
    B: "In the topology — the subagents should be able to message each other directly to fill gaps such as this one.",
    C: "In the returns subagent, which should have recognised the seller-notification requirement and handled it.",
    D: "In the subagent tool descriptions, none of which mention seller notification as part of handling a return."
  },
  correct: ["A"],
  rule: "In a hub-and-spoke system the coordinator owns decomposition, dispatch and merge. When every subagent succeeds at its assigned task but the merged outcome has a gap, the gap was in the assignment. Coverage failures are decomposition failures, and they are not fixable by improving the workers.",
  why: {
    A: "Correct. The request contained three intents and only two were dispatched. The fix is in how the coordinator parses intent and validates that its subtask set covers every requested outcome before dispatching.",
    B: "Wrong, and a double trap: it both mislocates the defect and proposes the flat-topology anti-pattern. Peer-to-peer subagent messaging multiplies coordination paths, makes failures untraceable, and does not fix a coordinator that mis-parsed the request.",
    C: "Wrong. Subagents start with a clean context and see only their delegation prompt. The returns agent never saw \"tell the seller\" and could not have known about it. Blaming the worker for a scoping omission is the exact trap this item sets.",
    D: "Wrong. Tool descriptions govern which tool gets picked <em>within</em> a task. They cannot create a task that was never dispatched."
  }
},
{
  n: 5, domain: "AAO", topic: "Topic 1", sc: "S2",
  stem: "Northwind's logistics subagent frequently asks for information the customer already provided earlier in the conversation, such as the delivery address correction. Engineers propose fixes. Which explanation is correct?",
  opts: {
    A: "The logistics subagent needs a larger context window than the coordinator currently allocates to it at dispatch.",
    B: "The coordinator should re-ask the customer for their delivery address before dispatching work to the subagent.",
    C: "Subagents inherit the coordinator's full conversation history, so that history must have been compacted too aggressively.",
    D: "Subagents start with a clean context and see only the delegation prompt, so the coordinator must pass what they need."
  },
  correct: ["D"],
  rule: "Non-fork subagents begin with a fresh context: the system prompt from their definition, the delegation message, and their own configuration. They do not receive the main conversation history. Explicit information passing is therefore the coordinator's responsibility, and a structured handoff payload is the mechanism.",
  why: {
    A: "Wrong. The information is not in the subagent's context at all, so no amount of window would surface it. Window size is the wrong axis.",
    B: "Wrong, and user-hostile: re-asking the customer for information they already gave is the symptom the scenario complains about, promoted to a design.",
    C: "Wrong — it inverts the actual behaviour. Only a <em>fork</em> inherits the parent conversation; a normal subagent does not. This distractor is effective precisely because inheritance is the intuitive assumption.",
    D: "Correct, and it is the single most-tested fact about subagents. The fix is for the coordinator to include the corrected address and other established facts in the delegation prompt."
  }
},
{
  n: 6, domain: "AAO", topic: "Topic 1", sc: "S3",
  stem: "Helix's log-analysis subagent times out roughly 4% of the time. Its current implementation returns <code>{\"logs\": []}</code> on timeout so the coordinator \"keeps moving\". Incident commanders report the agent sometimes states there were no relevant log entries when in fact the search never ran. What should the subagent return instead?",
  opts: {
    A: "The same empty result, with a note in the coordinator's system prompt warning that empty results may mean failure.",
    B: "A structured error naming the failure category, whether it is retryable, the query attempted, and partial results.",
    C: "Nothing — it should raise an exception that aborts the entire incident session and surfaces the fault to the caller upstream.",
    D: "A best-effort summary of the incident, generated from whatever context the subagent already happens to have in hand."
  },
  correct: ["B"],
  rule: "Silent subagent failure is one of the exam's named anti-patterns. An empty result is indistinguishable from a genuine \"no matches\", so the coordinator draws a confident wrong conclusion. Failures must be reported as structured, actionable error context so the coordinator can retry, route around, or escalate.",
  why: {
    A: "Wrong. It leaves the ambiguity in the data and asks the model to remember a caveat — probabilistic enforcement of a distinction the payload should encode. And it makes every genuine empty result suspect.",
    B: "Correct. Category plus retryability plus the attempted query plus partial results is exactly what the coordinator needs to decide between retrying, narrowing the query, proceeding without log evidence but saying so, or escalating.",
    C: "Wrong. One subagent's timeout should degrade the incident response, not abort it. Partial failure handling means the coordinator continues with a known gap; aborting a SEV-1 session because logs were slow is a worse outcome than the bug.",
    D: "Wrong, and the most dangerous option: it fabricates analysis with no evidence, which is precisely how an incident gets misdiagnosed. A subagent that cannot do its job must say so."
  }
},
{
  n: 7, domain: "AAO", topic: "Topic 1", sc: "S1",
  stem: "Meridian's orchestrator loops up to <code>MAX_TURNS = 12</code>. When the budget is exhausted, control falls out of the loop and the function returns <code>undefined</code>. What is the minimal correct change?",
  opts: {
    A: "Escalate explicitly with a reason code such as <code>TURN_BUDGET_EXHAUSTED</code>, attaching the partial progress.",
    B: "Recursively call the session runner again with a fresh turn budget and the existing conversation history.",
    C: "Log a warning and let the caller decide what to do with the <code>undefined</code> value that it receives back.",
    D: "Return the last assistant message that was produced, so that the customer at least receives something."
  },
  correct: ["A"],
  rule: "Every exit path from the loop must map to exactly one terminal state. Budget exhaustion is an exit path, so it needs an explicit escalation with a machine-readable reason code and the work done so far, so the human does not restart from zero.",
  why: {
    A: "Correct. It converts an implicit fall-through into a recorded decision, and the reason code makes the failure mode measurable — you can now count how often budget exhaustion happens and tune from data.",
    B: "Wrong. Unbounded recursion with fresh budgets is an unbounded-retry anti-pattern wearing different clothes — a cost incident waiting to happen, and the recursion still needs a terminal state at its own limit.",
    C: "Wrong. Pushing an unhandled state to the caller relocates the bug rather than fixing it, and a warning log is not an outcome record. The regulator asked for documented outcomes, not warnings.",
    D: "Wrong. The last assistant message is mid-reasoning by definition; it was not a resolution, and returning it to a banking customer as if it were one is how you get a regulatory finding. It also still leaves no terminal record."
  }
},
{
  n: 8, domain: "AAO", topic: "Topic 1", sc: "S4",
  stem: "Vantage deploys during business hours. Engineers notice that sessions in flight at deploy time disappear: no resolution, no escalation, no ticket update. The orchestrator already wraps its loop in <code>try/catch/finally</code> and asserts a terminal state in the <code>finally</code> block. Why is this still happening, and what fixes it?",
  opts: {
    A: "The deploy should be moved into a maintenance window scheduled for a time of day when no customer sessions are active.",
    B: "Sessions should be held entirely in memory so that they are naturally discarded whenever the process restarts.",
    C: "The <code>finally</code> block is never awaited, so making that cleanup path fully synchronous will close the gap here.",
    D: "Container termination will not run in-process cleanup; only durable state plus an external sweeper closes the path."
  },
  correct: ["D"],
  rule: "In-process safeguards cover in-process failures. A killed container, an evicted node or an OOM kill runs no <code>finally</code> block at all. The only safeguard that survives is state persisted outside the process plus a reaper that periodically sweeps for sessions stuck in a non-terminal status past their SLA.",
  why: {
    A: "Wrong. It reduces exposure without closing the path, and it trades away continuous delivery to paper over an architectural gap. Crashes and evictions still occur outside deploy windows.",
    B: "Wrong, and it makes the problem permanent: in-memory-only sessions cannot be swept, resumed, or audited. The regulator's documented-outcome requirement becomes unmeetable by construction.",
    C: "Wrong. Await semantics do not matter when the process receives <code>SIGKILL</code> — no user code runs at all. Graceful shutdown handling helps for <code>SIGTERM</code> but is still best-effort.",
    D: "Correct, and this is the most-missed safeguard in the whole topic. Note it also covers cases nobody enumerated: network partitions, hung awaits, and bugs that leave the loop spinning."
  }
},
{
  n: 9, domain: "AAO", topic: "Topic 1", sc: "S2",
  stem: "To reduce coordinator load, an engineer proposes letting Northwind's subagents call each other directly: the returns agent could ask the logistics agent about carrier pickup without going through the coordinator. What is the strongest objection?",
  opts: {
    A: "Subagents cannot technically invoke one another, so the runtime would reject the call before dispatching it.",
    B: "It would increase token cost, because each direct call re-sends the full system prompt and every tool definition.",
    C: "Direct calls between subagents would exceed the API rate limit at 12,000 concurrent customer sessions.",
    D: "It abandons hub-and-spoke: nothing owns the merged outcome, failures go untraceable, and paths multiply."
  },
  correct: ["D"],
  rule: "Hub-and-spoke with a central coordinator is the tested topology. One component owns decomposition, merge, and the terminal outcome. Flat peer-to-peer topologies are an named anti-pattern: with N agents you get N-squared potential interactions, no single place holds the truth about session state, and partial failures propagate invisibly.",
  why: {
    A: "Factually wrong as stated — agent-to-agent delegation and messaging are possible. The objection is that it is the wrong design here, not that it is impossible.",
    B: "Weak and secondary. Cost is real but is not what makes the topology wrong, and it would not change if tokens were free.",
    C: "Weak. Rate limits are a capacity concern solvable with batching, concurrency control or quota increases. The exam wants the structural objection, and a scaling argument implies the design would be fine at lower volume — it would not.",
    D: "Correct. The architectural objection is about ownership and traceability, not throughput. If the returns agent gets a wrong answer from logistics and acts on it, no component is positioned to notice."
  }
},
{
  n: 10, domain: "AAO", topic: "Topic 1", sc: "S4",
  stem: "A Vantage session returns <code>stop_reason: refusal</code> when a user asks the agent to disable audit logging on their workstation. The orchestrator currently retries the request three times, then returns the third refusal to the user. What is the correct handling?",
  opts: {
    A: "Treat <code>refusal</code> as terminal and escalate to a human at once, recording the reason code on the session.",
    B: "Return the refusal text to the customer and then close the session out as RESOLVED in the ticketing system.",
    C: "Retry the turn with a rephrased prompt that steers around whatever it was that triggered the refusal.",
    D: "Fall back to a smaller, less restricted model that is unlikely to refuse the same customer request."
  },
  correct: ["A"],
  rule: "<code>refusal</code> is a terminal stop reason. Retrying it wastes budget and, if the retry succeeds through rephrasing, you have engineered your way around a safety boundary. The correct path is escalation with a reason code, which also gives you a measurable signal about which requests are hitting refusals.",
  why: {
    A: "Correct. It terminates the session properly, puts a human on a request that may well be legitimate (an audit-logging change might be an authorised admin task), and produces data.",
    B: "Wrong. Nothing was resolved. Closing as RESOLVED corrupts your outcome metrics and denies the user any path forward.",
    C: "Wrong on two counts: it is an unbounded-retry pattern, and deliberately rephrasing to evade a refusal is exactly the behaviour a service desk should not automate.",
    D: "Wrong, and worse: routing around a safety boundary by downgrading models is an explicit anti-pattern, and it would degrade every other aspect of the response."
  }
},
{
  n: 11, domain: "AAO", topic: "Topic 1", sc: "S1",
  stem: "Meridian's orchestrator determines whether a session is complete by checking whether the assistant's final message matches <code>/resolved|completed|all set/i</code>. Sessions are being closed incorrectly in both directions. What is the correct completion signal?",
  opts: {
    A: "A fixed turn count after which the session can be assumed to have completed its work.",
    B: "A more comprehensive regular expression covering additional completion phrasings.",
    C: "Asking the model, in a follow-up turn, whether or not it considers the session complete.",
    D: "The API's <code>stop_reason</code>, combined with verification that a terminal action occurred."
  },
  correct: ["D"],
  rule: "The loop is driven by <code>stop_reason</code>, never by the model's prose. Assistant text is free-form and changes with prompts, models and phrasing; <code>stop_reason</code> is a contractual field. Completion is <code>end_turn</code> plus verification that the world changed as claimed.",
  why: {
    A: "Wrong. Turn count is unrelated to completion. Some sessions resolve in two turns; some need nine and still fail.",
    B: "Wrong. Expanding the regex chases an infinite space of phrasings and still misfires on \"I have not resolved this\" — which matches \"resolved\". Parsing prose for control flow is the anti-pattern itself.",
    C: "Wrong. Model self-assessment is the same class of unreliable signal as self-reported confidence: unverifiable, uncalibrated, and it costs an extra turn to obtain.",
    D: "Correct. It replaces a brittle heuristic with the documented contract, and pairs it with the verification gate that distinguishes a real resolution from a polite non-answer."
  }
},
{
  n: 12, domain: "AAO", topic: "Topic 1", sc: "S2",
  stem: "Northwind wants to cut cost. An architect proposes running the coordinator on the cheapest available model and the four subagents on the strongest, reasoning that \"the subagents do the real work.\" What is the flaw?",
  opts: {
    A: "The coordinator does the hardest reasoning — decomposition and merge — so weakening it degrades every result.",
    B: "There is no flaw here; delegating the heavy lifting to stronger subagent models is a standard, proven pattern.",
    C: "Subagents should always run on exactly the same model as the coordinator, so their behaviour stays consistent.",
    D: "Mixing different models across agents within a single workflow is not supported by the orchestration layer."
  },
  correct: ["A"],
  rule: "Decomposition quality bounds the whole system. Subagents execute well-specified, narrow tasks — often a good fit for a cheaper model — while the coordinator handles ambiguity, coverage and synthesis. The usual correct routing is the inverse of the proposal: strong coordinator, cheaper workers.",
  why: {
    A: "Correct, and it connects to the coverage-gap item earlier: a weak coordinator produces incomplete subtask sets, and no amount of subagent capability recovers a task that was never dispatched.",
    B: "Wrong. It states the anti-pattern as if it were the pattern — an effective distractor because \"delegate work to the strong model\" sounds like received wisdom.",
    C: "Wrong. Heterogeneous model routing is a legitimate and often optimal cost lever; the error in the proposal is the direction, not the mixing.",
    D: "Factually wrong. Per-subagent model selection is explicitly supported, including inheriting the parent model."
  }
},
{
  n: 13, domain: "AAO", topic: "Topic 1", sc: "S3",
  stem: "Helix's SEV-1 SLA is a first meaningful update within 15 minutes. Some agent sessions run 40 minutes exploring diagnostics before producing anything. Which control best protects the SLA without discarding the agent's work?",
  opts: {
    A: "Instruct the agent in its system prompt to work as quickly as possible during a live SEV-1 incident.",
    B: "Run all of the diagnostic queries in parallel so that the whole set completes far faster than it does today.",
    C: "Reduce <code>MAX_TURNS</code> so that an incident session simply cannot run for anything like that long.",
    D: "A wall-clock deadline checked inside the loop that escalates with whatever findings have been gathered."
  },
  correct: ["D"],
  rule: "A turn budget bounds iterations, not time — a single turn with a slow tool can blow an SLA on its own. SLAs are wall-clock properties and need a wall-clock deadline enforced in the orchestration layer, with escalation carrying partial progress so the work is not wasted.",
  why: {
    A: "Wrong. Prompt-based enforcement of a hard deadline — unmeasurable, unenforceable, and it fails in exactly the long sessions that need it.",
    B: "A genuine and useful optimisation for independent diagnostics, but it is a latency improvement, not a guarantee. Some session will still exceed 15 minutes, and the SLA needs a control that fires when it does.",
    C: "Wrong axis. Turns and minutes are not interchangeable; a five-turn session with three slow log queries can exceed 15 minutes, and a twelve-turn session of fast lookups may not.",
    D: "Correct. It converts a deadline into a terminal state and hands the on-call engineer the diagnostics already gathered, which is the whole value of the agent in a time-boxed incident."
  }
},
{
  n: 14, domain: "AAO", topic: "Topic 1", sc: "S4", type: "multi",
  stem: "Vantage must be able to answer, for any past session: what happened, why it ended, and what a human did next. Which TWO design elements are essential?",
  opts: {
    A: "Have the agent write a natural-language summary of each session into the ticket when the session finishes.",
    B: "Persist a session record with a status, a machine-readable termination reason, and the tool calls with outcomes.",
    C: "Store the complete raw transcript of every session, including all model reasoning, and search it when questions arise.",
    D: "Capture, on every escalated session, what the human actually did differently from what the agent had proposed."
  },
  correct: ["B","D"],
  rule: "Auditability and improvement both require <em>structured</em> session metadata: status, a typed termination reason and the action trail. The highest-value single field in an agentic feedback loop is the delta between what the agent proposed and what the human actually did — a real, expert-labelled counterfactual on exactly the cases the agent failed.",
  why: {
    A: "Wrong. A model-written summary of a session that may have failed is unreliable evidence about that failure, and prose cannot be aggregated. Structured metadata written by the orchestrator is the reliable record.",
    B: "Correct. Typed reason codes make termination causes aggregatable and rankable; free text does not. This is what turns \"some sessions fail\" into \"31% of failures are AUTHORITY_EXCEEDED on refunds.\"",
    C: "Wrong as an essential element. Raw transcripts are expensive to store, hard to aggregate, and cannot answer \"which failure mode is most common?\" They may be useful for spot-debugging, but they are not what makes the system auditable or improvable.",
    D: "Correct. It tells you which of the three levers to pull — a missing tool, a missing policy, or an authority gap — and it is the only field that carries a correct answer for the hard cases."
  }
},
{
  n: 15, domain: "AAO", topic: "Topic 1", sc: "S2",
  stem: "Northwind's coordinator dispatches four subagents in parallel for a complex request. Three succeed; the seller-policy agent returns a structured error indicating the policy service is unavailable and the failure is retryable. What should the coordinator do?",
  opts: {
    A: "Substitute for the seller-policy agent's output with the coordinator's own best guess at the applicable policy.",
    B: "Compose the reply from the three successful results and say nothing about the missing policy check.",
    C: "Discard all four of the results and restart the entire customer request from scratch with fresh subagent calls.",
    D: "Retry the seller-policy agent within a bounded budget, then answer with the three results, stating the gap."
  },
  correct: ["D"],
  rule: "Structured errors exist so the coordinator can act on them. A retryable failure justifies a bounded retry; if it persists, the correct behaviour is graceful degradation with the gap disclosed. Partial failure handling means continuing with a known, stated gap — never with a hidden one.",
  why: {
    A: "Wrong, and the worst option. Fabricating a policy determination in a marketplace with 40,000 sellers each having different policies is how you promise a refund you cannot honour.",
    B: "Wrong. This is silent degradation: the customer receives an answer that appears complete but skipped a policy check that may determine whether a return is even eligible.",
    C: "Wrong. Discarding three successful subagent results because one dependency was slow triples cost and latency and makes the system brittle at peak. Retry the failed unit, not the whole request.",
    D: "Correct. It uses the <code>isRetryable</code> signal, bounds the retry, preserves the successful work, and keeps the customer-facing answer honest about what was not verified."
  }
},
{
  n: 16, domain: "AAO", topic: "Topic 1", sc: "S1",
  stem: "Meridian's agent sometimes asks a clarifying question (\"which of the two $89 charges do you mean?\") and the session then sits idle because the customer never replies. These sessions are currently counted as IN_PROGRESS indefinitely. What is the correct model?",
  opts: {
    A: "Prevent the agent from asking the customer clarifying questions that it cannot itself resolve.",
    B: "Count them as ESCALATED, on the grounds that a human being will eventually have to look at them anyway.",
    C: "Introduce a suspended state (AWAITING_CUSTOMER) with a timer that ages into RESOLVED or ESCALATED.",
    D: "Count them as RESOLVED, on the grounds that the agent already did its part of the exchange."
  },
  correct: ["C"],
  rule: "The invariant is that no session sits in a non-terminal state indefinitely. Suspended states are legitimate and useful, but each one needs its own timer and its own transition into a terminal state, or it becomes the silent-drop path in disguise.",
  why: {
    A: "Wrong, and counterproductive. Clarifying questions are how the agent avoids acting on the wrong charge. Removing them to simplify state modelling trades correctness for bookkeeping.",
    B: "Wrong. Escalating every unanswered clarification floods the human queue with sessions where the customer simply walked away, which is the most common reason for the silence.",
    C: "Correct. It models reality accurately — the session genuinely is waiting on the customer — while keeping the guarantee intact through an aging policy.",
    D: "Wrong. Nothing was resolved, and marking waiting sessions as resolved inflates your resolution rate with unfinished work, which is precisely the metric corruption the regulator's requirement targets."
  }
},
{
  n: 17, domain: "CCW", topic: "Topic 2", sc: "S6",
  stem: "Corvus documented in <code>CLAUDE.md</code>: \"NEVER read files in <code>infra/secrets/</code>.\" An audit finds 11 sessions in three months where Claude read those files. Platform engineering proposes making the instruction bolder and repeating it at the top and bottom of the file. What should you recommend instead?",
  opts: {
    A: "Shorten <code>CLAUDE.md</code> so that the instruction becomes far more prominent, and switch to a stronger model.",
    B: "Add a <code>PostToolUse</code> hook that logs a security alert whenever any of the secrets files has been read.",
    C: "Move the rule to <code>permissions.deny</code> as <code>Read(./infra/secrets/**)</code> in managed settings, so it cannot be overridden.",
    D: "Repeat the instruction in every team's nested <code>CLAUDE.md</code> file so that it appears far more often in the context."
  },
  correct: ["C"],
  rule: "CLAUDE.md is context delivered to the model, not enforced configuration. It shapes behaviour without guaranteeing it, at any font size or repetition count. Requirements whose violation is a security or compliance event belong in <code>permissions.deny</code>, and requirements that must survive a developer editing project settings belong in managed settings, which sit above project and local layers and cannot be excluded.",
  why: {
    A: "Wrong. Shortening CLAUDE.md genuinely does improve adherence, and a stronger model may follow instructions better, but \"better odds\" is not what an audit finding requires. Both are probabilistic answers to a request for a guarantee.",
    B: "Partially useful but wrong as the answer. A <code>PostToolUse</code> hook fires after the read — the secret is already in the context window and the incident has occurred. Detection is not prevention.",
    C: "Correct. Deny rules are evaluated by the client before the tool runs, independent of any model decision, and the managed layer removes the override path.",
    D: "Wrong. Repetition consumes context and does not change the mechanism; an advisory instruction repeated five times is still advisory. It also creates the contradictory-instruction problem across nested files."
  }
},
{
  n: 18, domain: "CCW", topic: "Topic 3", sc: "S6",
  stem: "Corvus wants to guarantee that an AWS access key can never be written into a source file by a Claude session. Which mechanism satisfies \"can never\"?",
  opts: {
    A: "A <code>PostToolUse</code> hook on <code>Edit|Write</code> that scans the file and exits 2 on a key pattern.",
    B: "A <code>Stop</code> hook that runs a full secret scanner over the repository before the agent finishes its turn.",
    C: "A <code>CLAUDE.md</code> rule instructing Claude never to write credentials into tracked files.",
    D: "A <code>PreToolUse</code> hook on <code>Edit|Write</code> that inspects <code>tool_input</code> and denies on a key pattern."
  },
  correct: ["D"],
  rule: "The discriminator is one word in the requirement: <em>never</em> means prevention, and only <code>PreToolUse</code> runs before the tool executes and can block it. <code>PostToolUse</code> and <code>Stop</code> are verification events — they run after the write has already happened.",
  why: {
    A: "Wrong for this requirement, though a reasonable defence in depth. By the time it fires, the key is on disk — and if the working tree is being watched, synced, or the file is committed by another process, the exposure is real.",
    B: "Wrong. <code>Stop</code> fires at end of turn, potentially many edits after the write. Useful as a final gate, not as prevention.",
    C: "Wrong. Advisory context cannot produce a guarantee, and credentials are the archetypal case where a single violation is the whole cost.",
    D: "Correct. It inspects the proposed tool input and denies before anything touches the filesystem, which is what \"can never be written\" requires."
  }
},
{
  n: 19, domain: "CCW", topic: "Topic 3", sc: "S6",
  stem: "A Corvus <code>PostToolUse</code> hook runs the type-checker and, on failure, executes <code>echo \"type check failed\" >&2; exit 2</code>. Claude reliably notices the failure but its fix attempts are scattershot, often editing unrelated files. What single change most improves the loop?",
  opts: {
    A: "Print the real compiler diagnostics — file, line and message — to stderr instead of a generic string.",
    B: "Move the type-check into a <code>Stop</code> hook so that it runs once per turn rather than once per edit.",
    C: "Change the hook's exit code from 2 to 1 so that Claude is no longer blocked and is able to keep going.",
    D: "Add a line to <code>CLAUDE.md</code> telling Claude to fix any type errors carefully before moving on."
  },
  correct: ["A"],
  rule: "On exit code 2, the hook's <strong>stderr becomes Claude's next input</strong>. That text is the model's entire view of the failure. A generic message forces the model to guess which file and which error, producing the scattershot behaviour described; real diagnostics produce a targeted fix.",
  why: {
    A: "Correct, and it is the highest-leverage change in the whole hook. Bound the output with <code>head</code> so a thousand-line cascade does not flood the context.",
    B: "Wrong axis. Moving the event changes when the check runs, not what information the model receives. The scattershot fixes would continue, just less often.",
    C: "Wrong, and it makes things worse. Exit 1 is a non-blocking error: the edit stands and the type error survives into the codebase. You would trade poor fixes for no fixes.",
    D: "Wrong. The model is not being careless; it is being starved of information. No prompt instruction supplies the file and line number that the hook is withholding."
  }
},
{
  n: 20, domain: "CCW", topic: "Topic 3", sc: "S6",
  stem: "Corvus added a <code>PostToolUse</code> hook running the full 6-minute monorepo test suite after every <code>Edit</code>. Within two weeks, half the teams had added <code>\"disableAllHooks\": true</code> to their local settings. What is the correct fix?",
  opts: {
    A: "Block teams from editing local settings at all, by removing write access to the settings file.",
    B: "Increase the hook timeout so that the full test suite has enough time to finish.",
    C: "Scope the hook to tests related to the edited file, moving the full suite to <code>Stop</code> and CI.",
    D: "Accept the trade-off, on the grounds that correctness matters more than developer experience."
  },
  correct: ["C"],
  rule: "A quality gate only enforces anything while it is enabled. Expensive checks must be scoped to stay usable: related tests per edit, the full suite at end of turn or in CI. The layered answer — fast local hook for self-correction, branch-protected CI as the authority — is the pattern the exam rewards.",
  why: {
    A: "Wrong. Fighting your users for control of their own machines is a losing strategy that produces worse workarounds, and hooks were never a boundary against a determined operator. Use managed settings plus CI when you need a real guarantee — but the hook still has to be usable.",
    B: "Wrong. The problem is not that the suite times out; it is that six minutes per edit destroys the workflow. A longer timeout makes it worse.",
    C: "Correct. It preserves fast feedback inside the session, keeps the comprehensive check where latency does not hurt, and removes the incentive to disable hooks entirely.",
    D: "Wrong, and it misreads the outcome: correctness did not win. Half the teams now have <em>no</em> local enforcement at all, so the aggressive gate produced less quality than a scoped one would have."
  }
},
{
  n: 21, domain: "CCW", topic: "Topic 3", sc: "S6",
  stem: "Corvus wants a hook that fires on file edits and writes, and on the GitHub MCP server's issue-creation tool, but not on reads or shell commands. Which matcher configuration is correct?",
  opts: {
    A: "A single hook entry with <code>\"matcher\": \"*\"</code> and the filtering logic inside the script.",
    B: "One entry with <code>\"matcher\": \"Edit|Write|create_issue\"</code>, relying on the bare tool name to match.",
    C: "One entry with <code>\"matcher\": \"Edit, Write, github\"</code> written as a comma-separated list of tools.",
    D: "Two entries: <code>\"matcher\": \"Edit|Write\"</code> and a second matching <code>\"mcp__github__create_issue\"</code>."
  },
  correct: ["D"],
  rule: "Matchers containing only letters, digits, underscores, hyphens, spaces, commas and pipes are treated as exact names or alternation lists. Anything containing other characters is evaluated as an unanchored JavaScript regex. MCP tools are named <code>mcp__&lt;server&gt;__&lt;tool&gt;</code>, so they must be matched by their full namespaced name.",
  why: {
    A: "Wrong. <code>\"*\"</code> fires the hook on every tool including <code>Read</code> and <code>Bash</code>, then relies on script logic to bail out. It works, but it burns a process spawn on every tool call and puts routing logic in the wrong layer.",
    B: "Wrong. Because the value contains only letters and pipes it is treated as an exact alternation list, so <code>create_issue</code> is matched literally and will never equal <code>mcp__github__create_issue</code>.",
    C: "Wrong. <code>github</code> is not a tool name. The tool is <code>mcp__github__create_issue</code>, and the bare word will not match it.",
    D: "Correct. Separate entries keep each matcher precise and let the two hooks run different scripts, which they almost certainly should."
  }
},
{
  n: 22, domain: "CCW", topic: "Topic 2", sc: "S6", type: "multi",
  stem: "Corvus has a 900-line root <code>CLAUDE.md</code> mixing security rules, formatting standards, per-language conventions and the release runbook. Adherence is poor and context is bloated. Which TWO restructuring moves give the largest improvement?",
  opts: {
    A: "Move per-language conventions into <code>.claude/rules/*.md</code> with <code>paths:</code> frontmatter so they load on demand.",
    B: "Move the security rules into <code>permissions.deny</code>/<code>ask</code>, and the mechanically checkable rules into hooks.",
    C: "Move the release runbook into a nested <code>CLAUDE.md</code> inside the repo's <code>release/</code> directory.",
    D: "Split the file into several smaller files, each referenced from the root <code>CLAUDE.md</code> with <code>@path</code> imports."
  },
  correct: ["A","B"],
  rule: "Two independent problems are being solved: enforcement (rules that must hold belong in permissions and hooks, not context) and context cost (instructions that only matter sometimes should load only then). Path-scoped rules genuinely defer tokens; <code>@path</code> imports do not.",
  why: {
    A: "Correct. Path-scoped rules are the mechanism that actually reduces baseline context, because they load when Claude reads a matching file rather than at launch.",
    B: "Correct. It fixes the adherence problem at its root: rules that must hold 100% of the time were never going to be reliably enforced by context of any length.",
    C: "Weak. A runbook is a multi-step procedure that belongs in a skill, loaded on demand. A nested CLAUDE.md would load whenever Claude reads files in that directory, which is both too often and too rarely.",
    D: "Wrong, and the sharpest distractor here. Imports improve <em>organisation</em> but imported files are expanded and loaded at launch, so the context bill is identical. It solves the tidiness problem and none of the real ones."
  }
},
{
  n: 23, domain: "CCW", topic: "Topic 2", sc: "S6",
  stem: "A Corvus engineer adds <code>\"permissions\": {\"allow\": [\"Read(./infra/secrets/**)\"]}</code> to their <code>.claude/settings.local.json</code> because a debugging task needs it. Security has the same path in <code>deny</code> in the enterprise managed policy. What happens, and why?",
  opts: {
    A: "Claude prompts the user to choose between them, since the rules are in direct conflict.",
    B: "The read is denied: managed policy outranks every user-editable layer, and <code>deny</code> beats <code>allow</code>.",
    C: "The behaviour here is undefined and depends on the order in which the settings files are loaded.",
    D: "The local allow wins, because local settings always take higher precedence than project settings."
  },
  correct: ["B"],
  rule: "Precedence runs managed policy → command-line arguments → local settings → project settings → user settings, and within permissions <code>deny</code> beats <code>ask</code> beats <code>allow</code>. Managed policy is the only layer an end user cannot override, which is why every \"guarantee this org-wide\" answer resolves there.",
  why: {
    A: "Wrong. There is no interactive resolution for a policy conflict; the policy simply wins.",
    B: "Correct on both counts. This is exactly why security requirements are deployed as managed settings rather than committed project settings.",
    C: "Wrong. Precedence is well-defined and deterministic, not load-order dependent.",
    D: "Wrong. Local does outrank project, which makes this distractor plausible — but managed policy outranks everything, and that is the layer in play."
  }
},
{
  n: 24, domain: "CCW", topic: "Topic 2", sc: "S6",
  stem: "Corvus adds a GitHub Actions job that runs <code>claude \"review the diff and report issues\"</code>. The job times out at 60 minutes with no output on every run. What is wrong?",
  opts: {
    A: "The GitHub Actions runner lacks the permissions it needs to read the pull request diff.",
    B: "Without <code>-p</code> (<code>--print</code>), the CLI starts an interactive session that never exits in CI.",
    C: "The prompt is too vague, so the model just keeps exploring the repository.",
    D: "The API key is not set, so the process just sits there waiting on authentication input."
  },
  correct: ["B"],
  rule: "<code>-p</code>/<code>--print</code> is what makes Claude Code non-interactive: run the prompt, print the result, exit. Without it, a CI runner attaches to an interactive REPL with no TTY input and hangs until the job times out. This is the single most-tested CI fact in the exam.",
  why: {
    A: "Wrong. A permissions problem also fails fast and produces a visible error; it does not hang.",
    B: "Correct. Add <code>--output-format json</code> alongside it so the pipeline can parse the result, and scope tools with <code>--allowedTools</code> rather than granting a blanket bypass.",
    C: "Wrong. An over-broad prompt costs tokens and time but still terminates. A hang with <em>no output at all</em> points at the process never entering a printing mode.",
    D: "Wrong. A missing key produces a fast authentication error, not a 60-minute silent hang."
  }
},
{
  n: 25, domain: "CCW", topic: "Topic 2", sc: "S6",
  stem: "To save on startup cost, a Corvus engineer configures the CI review job to resume the same Claude Code session across all pull requests. Reviewers start reporting comments about code that is not in the diff under review. What is the cause and the fix?",
  opts: {
    A: "Session reuse leaks the last PR's context into the next review; each run needs isolation.",
    B: "The model is simply hallucinating these findings; switching to a stronger model will fix it.",
    C: "The diff command is picking up the wrong base branch when it builds up the comparison.",
    D: "Context compaction is dropping the current diff, so automatic compaction needs to be off."
  },
  correct: ["A"],
  rule: "Session isolation is a correctness requirement for CI review, not an optimisation. A resumed session carries the prior conversation, so the model reasons about code from an unrelated change set — producing confident, specific, wrong comments. Fresh session per run.",
  why: {
    A: "Correct. The symptom is diagnostic: comments about real code that is genuinely absent from this diff is contamination, not fabrication.",
    B: "Wrong. The comments describe code that actually exists — just in the previous PR. That is contamination, and a stronger model reasoning over contaminated context produces more convincing wrong comments.",
    C: "Plausible and worth ruling out, but a wrong base branch produces a diff that is too large or too small, not commentary on a different pull request from an earlier run.",
    D: "Wrong. Compaction summarises rather than substituting another PR's content, and disabling it would make the contaminated session larger, not cleaner."
  }
},
{
  n: 26, domain: "CCW", topic: "Topic 2", sc: "S6",
  stem: "Corvus wants dependency changes reviewed by a human, but blocking them entirely stops legitimate work and pushes engineers to disable the config. Which permission configuration fits?",
  opts: {
    A: "A <code>\"deny\": [\"Edit(package.json)\"]</code> rule in the project settings.",
    B: "<code>\"ask\": [\"Edit(package.json)\", \"Edit(pnpm-lock.yaml)\"]</code> in settings.",
    C: "<code>\"allow\": [\"Edit(package.json)\"]</code> plus a CLAUDE.md note to confirm first.",
    D: "A <code>PostToolUse</code> hook that reverts any change made to <code>package.json</code> afterwards."
  },
  correct: ["B"],
  rule: "<code>ask</code> is the middle ground candidates forget exists: the action is legitimate but consequential enough to warrant a human decision at the moment it happens. Over-choosing <code>deny</code> for consequential-but-valid actions is a recognised distractor pattern.",
  why: {
    A: "Wrong for the stated constraint. It blocks legitimate work, which the scenario explicitly says leads to engineers disabling the configuration — trading a controlled prompt for no control at all.",
    B: "Correct, and including the lockfile matters — changing dependencies without the lockfile, or vice versa, is its own defect.",
    C: "Wrong. Asking Claude to confirm is advisory; <code>ask</code> is the enforced version of the same idea and costs nothing extra.",
    D: "Wrong. Auto-reverting fights the user invisibly, discards intentional work, and produces confusing sessions where edits silently vanish."
  }
},
{
  n: 27, domain: "CCW", topic: "Topic 2", sc: "S6",
  stem: "Corvus wants React conventions applied only when Claude works with <code>.tsx</code> files, without adding them to every session's context. Which mechanism does this?",
  opts: {
    A: "A nested <code>CLAUDE.md</code> in every directory that contains <code>.tsx</code> files.",
    B: "An <code>@react-conventions.md</code> import in the root <code>CLAUDE.md</code>.",
    C: "<code>.claude/rules/react.md</code> with <code>paths: [\"**/*.tsx\"]</code> frontmatter.",
    D: "A <code>SessionStart</code> hook that injects the conventions as additional context."
  },
  correct: ["C"],
  rule: "Path-scoped rules are the mechanism that conditions instruction loading on the files being worked with. They load when Claude reads a file matching the glob, rather than at launch, which is what actually reduces baseline context cost.",
  why: {
    A: "Partially works but is a maintenance disaster in a monorepo, and nested files load whenever Claude reads anything in those directories, not specifically <code>.tsx</code> files.",
    B: "Wrong, and the key distinction in this topic. Imported files are expanded and loaded at launch alongside the importing file — organisation improves, context cost does not change at all.",
    C: "Correct, and precise: the <code>paths</code> glob is evaluated against files Claude reads, so the conventions arrive exactly when they are relevant.",
    D: "Wrong. <code>SessionStart</code> injects context into every session unconditionally — the opposite of what was asked."
  }
},
{
  n: 28, domain: "CCW", topic: "Topic 2", sc: "S6",
  stem: "Corvus builds a code-review subagent. It should read and search the repository and run <code>git diff</code>, but must never modify files. Which configuration expresses this most reliably?",
  opts: {
    A: "A <code>PostToolUse</code> hook that reverts any file that the review subagent writes during a review.",
    B: "A <code>tools:</code> allowlist in the subagent's own frontmatter granting <code>Read, Grep, Glob</code> only.",
    C: "A system prompt in the subagent's markdown body telling it to review only and never edit.",
    D: "<code>model: haiku</code>, on the grounds that a smaller model is less likely to attempt edits."
  },
  correct: ["B"],
  rule: "Role-scoped tool assignment is the structural control. A subagent's <code>tools:</code> allowlist determines what it can invoke at all — the edit tools are simply not present. This simultaneously reduces selection ambiguity and eliminates the blast radius, which is why \"give every agent every tool\" is a named anti-pattern.",
  why: {
    A: "Wrong. Detect-and-revert is a compensating control layered over an unnecessary capability. Removing the tool is simpler, cheaper and complete.",
    B: "Correct. Note <code>disallowedTools</code> is the complementary form when you want to inherit broadly and subtract a few.",
    C: "Wrong. Prompt-based restriction of a capability the agent actually possesses is probabilistic, and a review agent that edits one file in fifty is worse than useless in a PR pipeline.",
    D: "Wrong on the mechanism. Model size does not remove a capability, and downgrading the reviewer degrades exactly the reasoning you wanted from it."
  }
},
{
  n: 29, domain: "PESO", topic: "Topic 5", sc: "S5",
  stem: "Atlas finds that <code>policy_number</code> is fabricated on 27% of claim forms. Investigation shows those forms genuinely have no policy number — the claim predates policy issuance. The schema marks <code>policy_number</code> as <code>{\"type\": \"string\"}</code> and lists it in <code>required</code>. What is the root cause and correct fix?",
  opts: {
    A: "The prompt does not emphasise accuracy strongly enough; add \"do not guess — accuracy is critical\" to it.",
    B: "Add a validation-retry loop that re-extracts the document whenever the policy number returned looks implausible.",
    C: "The schema makes absence inexpressible, so the model must invent a value; use <code>[\"string\", \"null\"]</code> instead.",
    D: "Temperature is set too high for an extraction task of this kind; set it to 0 and re-run the whole batch."
  },
  correct: ["C"],
  rule: "A schema is a constraint the model must satisfy. If satisfying it requires inventing data, the model invents data — this is not carelessness, it is the grammar leaving no legal alternative. The root cause of fabrication on genuinely-absent fields is always the schema, never the prompt.",
  why: {
    A: "Wrong. The instruction and the schema contradict each other, and the schema is the harder constraint. You are asking the model to both always produce a string and not produce a string.",
    B: "Wrong, and it is the most seductive distractor. Retry loops fix mis-extraction — cases where the model could have got it right. Re-asking for data that is not on the page buys another fabrication at double the cost.",
    C: "Correct. Keeping the key required while making the value nullable is the preferred form: consumers always find the field and only test for <code>null</code>, and you can count nulls per field in your metrics.",
    D: "Wrong. Temperature 0 makes the fabrication <em>consistent</em>, not absent. The model still has to emit something string-shaped."
  }
},
{
  n: 30, domain: "PESO", topic: "Topic 5", sc: "S5",
  stem: "Atlas is deciding between two schema styles for fields that are often absent: (i) omit the field from <code>required</code> so the model can leave the key out, or (ii) keep the key in <code>required</code> but make the value nullable. Which is preferable for a pipeline feeding claims adjudication, and why?",
  opts: {
    A: "(i), because omitting the absent keys produces smaller payloads and a lower token cost.",
    B: "(ii), because consumers always find the key and only test <code>null</code>, so null rates stay measurable.",
    C: "(i), because a missing key is a far stronger signal of absence than an explicit null value ever is.",
    D: "Either one is equivalent in practice; the choice between them is purely a stylistic preference."
  },
  correct: ["B"],
  rule: "Required key with nullable value is the recommended pattern for extraction. It removes defensive key checks from every consumer, makes \"absent\" a first-class value you can count, and eliminates the ambiguity between \"the document lacked it\" and \"the extractor forgot it\".",
  why: {
    A: "Wrong priority, and marginal in size. Trading downstream robustness in a system that pays money for a handful of tokens is a bad exchange.",
    B: "Correct, and the measurability point is what closes the loop with Topic 7: you cannot aggregate null rates per field if the field sometimes simply is not there.",
    C: "Wrong — it is the reverse. An omitted key is ambiguous between absence and extractor failure; an explicit <code>null</code> is an affirmative statement that the model looked and found nothing.",
    D: "Wrong. They differ materially in consumer complexity and in what your metrics can see."
  }
},
{
  n: 31, domain: "PESO", topic: "Topic 5", sc: "S5",
  stem: "Atlas's <code>document_type</code> enum lists five values. Reviewers find that unusual documents are being classified into the nearest listed type, and separately that illegible scans are also being assigned a type. What is the correct schema change?",
  opts: {
    A: "Add a single <code>\"other\"</code> member to the enum, covering every kind of document that the list does not name.",
    B: "Add a <code>confidence</code> score alongside <code>document_type</code>, and threshold the classifications on it.",
    C: "Add both <code>\"other\"</code> (a real unlisted type) and <code>\"unclear\"</code> (illegible), which diagnose different problems.",
    D: "Remove the enum entirely and let the field accept any free-form string value at all instead."
  },
  correct: ["C"],
  rule: "Every closed enum needs two escape hatches doing different jobs. <code>\"other\"</code> signals a taxonomy gap — a real category you did not list — and is fixed by extending the enum. <code>\"unclear\"</code> signals an evidence gap — the document does not support a determination — and is fixed by better input quality or human review. One combined bucket hides which fix applies.",
  why: {
    A: "Half right, and the most common near-miss. A single bucket mixes taxonomy gaps with unreadable scans, so both queues get triaged wrong and neither rate means anything.",
    B: "Wrong. A model-generated confidence number is uncalibrated and unauditable, and thresholding on it reproduces the self-reported-confidence anti-pattern inside the extraction pipeline.",
    C: "Correct. Watching the two rates separately is also an early-warning system: a rising <code>\"other\"</code> rate tells you a new document type has entered the corpus.",
    D: "Wrong. Free-form strings destroy the categorical guarantee, produce dozens of synonymous spellings, and make downstream routing impossible."
  }
},
{
  n: 32, domain: "PESO", topic: "Topic 5", sc: "S5",
  stem: "Atlas enables structured outputs with a strict JSON schema. Malformed JSON and missing keys disappear entirely. However, adjusters report that roughly the same number of claims have <em>wrong</em> amounts as before. Why?",
  opts: {
    A: "The schema is not strict enough; adding <code>additionalProperties: false</code> to it will resolve the issue.",
    B: "The model needs a larger context window so that it can read each whole document accurately end to end.",
    C: "Structured outputs are fundamentally incompatible with numeric fields, so they should not be used for amounts.",
    D: "Schema enforcement fixes the shape of the output, not the truth of the values; accuracy needs verification."
  },
  correct: ["D"],
  rule: "Structured outputs guarantee syntactic conformance: valid JSON, correct types, legal enum members, required keys present. They have no opinion about whether the number matches the page. Syntactic and semantic errors are different failure classes and need different fixes.",
  why: {
    A: "Wrong. <code>additionalProperties: false</code> prevents invented <em>keys</em>, not incorrect <em>values</em>. It is good hygiene and irrelevant here.",
    B: "Wrong. Nothing in the scenario indicates truncation or a window limit, and adding window does not improve reading accuracy on a document that already fits.",
    C: "Factually wrong; numeric types are fully supported. Note the real limitation: numeric bounds like <code>minimum</code>/<code>maximum</code> are not supported and must live in your validation code.",
    D: "Correct. For amounts specifically, the highest-value addition is a post-parse validator that reconciles line items against the stated total and flags mismatches for review."
  }
},
{
  n: 33, domain: "PESO", topic: "Topic 6", sc: "S5",
  stem: "Atlas receives dates as <code>14/03/2026</code>, <code>03-14-2026</code>, <code>14 Mar 2026</code> and <code>2026-03-14</code>. Extracted values are correct but inconsistently formatted, and DD/MM versus MM/DD is sometimes resolved wrongly. Where should the fix go?",
  opts: {
    A: "Increase the number of few-shot examples in the prompt until the model converges on a single format.",
    B: "In the field's <code>description</code>: target format, DD/MM versus MM/DD resolution, and the ambiguous case.",
    C: "In the system prompt, as a general instruction telling the model to always use ISO-format dates.",
    D: "A regex post-processing layer downstream that normalises whatever format the model returns."
  },
  correct: ["B"],
  rule: "Format contracts belong in the field description, adjacent to the field they govern. A complete contract has three parts: the target format, the resolution rule for known ambiguities, and the fallback when resolution is impossible. Instructions that specify only the target leave the hardest case undefined — and undefined cases produce silent errors.",
  why: {
    A: "Wrong. Examples reinforce a contract; they are a poor substitute for stating it, and they cannot enumerate every ambiguity case.",
    B: "Correct, and the third clause is what candidates omit. <code>03/04/2026</code> with no regional signal must return <code>null</code> with an <code>ambiguous</code> status, not a coin flip.",
    C: "Weak. A distant, general instruction is diluted in long prompts and does not address the DD/MM resolution rule at all. Field-adjacent beats prompt-level for per-field contracts.",
    D: "Wrong for the ambiguity half. Regex can reformat <code>14 Mar 2026</code>, but no regex can decide whether <code>03/04/2026</code> is 3 April or 4 March — that requires document context the post-processor does not have."
  }
},
{
  n: 34, domain: "PESO", topic: "Topic 6", sc: "S5",
  stem: "Atlas measures field accuracy at 96% for its largest broker and 68% for a broker whose forms use a two-column layout with the totals block on page 3. Both use the same prompt and schema. What is the highest-value intervention?",
  opts: {
    A: "Move that particular broker's documents entirely into the human review queue instead.",
    B: "Add few-shot examples from that broker's layout, and consider routing by layout after classifying.",
    C: "Raise the retry count for that broker so that each failed extraction gets another attempt or two at it.",
    D: "Increase the context window so that each whole document fits into it far more comfortably."
  },
  correct: ["B"],
  rule: "Errors clustering on one layout family mean that layout is under-represented in the prompt. Few-shot examples are the targeted fix, and when layouts are structurally disjoint, classify-then-route beats one universal mega-prompt. Spend few-shot capacity where the model is actually failing.",
  why: {
    A: "Wrong as a first move. It concedes the automation goal for a whole broker without attempting the cheap, targeted fix, and the scenario explicitly says the review queue is the bottleneck.",
    B: "Correct. The segmented metric is the diagnosis; the intervention follows directly from it. This is also why aggregate accuracy is useless — the average of 96 and 68 looks acceptable.",
    C: "Wrong. Retries repeat the same misreading of the same unfamiliar layout. The model is not failing randomly, it is failing systematically.",
    D: "Wrong. Nothing indicates the document does not fit; the problem is where information sits on the page, not how much of it there is."
  }
},
{
  n: 35, domain: "PESO", topic: "Topic 6", sc: "S5",
  stem: "Atlas processes two workloads: an overnight backfill of 2.1 million archived documents, and live extraction of documents attached to claims while an adjuster waits on screen. An architect proposes moving both to the Message Batches API for the 50% saving. Evaluate.",
  opts: {
    A: "Correct for the overnight backfill only; the live path must stay on the standard API.",
    B: "Correct for both — the saving is substantial and the batch window is usually quite short.",
    C: "Correct for the live path only, on the grounds that batching smooths out latency spikes.",
    D: "Incorrect for both — batch processing does not support structured outputs."
  },
  correct: ["A"],
  rule: "The Message Batches API trades latency for roughly 50% cost, with a completion window that can extend to 24 hours. It is right for offline, asynchronous work and wrong for anything a human or a blocking pipeline is waiting on. The exam plants it in latency-sensitive scenarios precisely because the saving is real.",
  why: {
    A: "Correct, and the split is the answer: use the cost lever where latency is free, keep the real-time path on the standard API.",
    B: "Wrong. \"Usually short\" is not a guarantee, and an adjuster staring at a spinner for even ten minutes is an unusable product.",
    C: "Wrong, and inverted. Batching adds latency; it does not smooth it. The live path is the one place batch must not go.",
    D: "Factually wrong. Batch does not preclude structured outputs, so this eliminates the correct half of the answer for a false reason."
  }
},
{
  n: 36, domain: "PESO", topic: "Topic 6", sc: "S5",
  stem: "Atlas adds a validation-retry loop: when extraction output fails validation, re-run with the error appended. It fixes many format violations but for one field the loop consistently exhausts its three retries and then emits a fabricated value. What does this indicate?",
  opts: {
    A: "The field is genuinely absent from those documents, so no retry can recover it — permit null.",
    B: "The validation rule is simply too strict here and should be relaxed for this one field.",
    C: "The model is not reading the error feedback properly, so the feedback should be restated more clearly.",
    D: "The retry count is set too low; raising it to ten will clear the remaining failures."
  },
  correct: ["A"],
  rule: "Retry loops fix recoverable failures — a bad format, a fumbled field the model could read correctly on a second focused attempt. They cannot fix missing data. A loop that always exhausts and then fabricates is diagnostic: the data is not on the page, and the schema is forcing an answer.",
  why: {
    A: "Correct. Make the field nullable and record it in <code>fields_not_found</code>; the retry budget should not be spent on it at all.",
    B: "Wrong. The validator is correctly detecting that the output is unacceptable. Relaxing it would let the fabricated value through silently, which is strictly worse.",
    C: "Wrong. The model is reading the feedback and complying as best it can; the instruction is impossible to satisfy from the document.",
    D: "Wrong, and expensive: ten retries produce ten fabrications instead of three, at more than triple the cost, with the same final outcome."
  }
},
{
  n: 37, domain: "PESO", topic: "Topic 6", sc: "S5",
  stem: "Atlas reports pipeline accuracy of 94.2% and proposes auto-approving all extractions to clear the review backlog. The claims director refuses, saying the number is meaningless. What is the director's technical point?",
  opts: {
    A: "The sample used to compute that headline figure was in all likelihood far too small.",
    B: "Aggregate accuracy hides per-field and per-layout variation; set thresholds per field.",
    C: "94.2% is simply far too low for financial processing, regardless of how it is measured.",
    D: "Accuracy should be replaced altogether by precision and recall for this kind of task."
  },
  correct: ["B"],
  rule: "Segment metrics by document type, vendor/layout and field. A pipeline at 99% on invoice numbers and 61% on tax IDs for one broker family averages to something respectable and fails a specific business process completely. Segmentation is also what lets you automate the reliable fields and route only the weak ones to review.",
  why: {
    A: "Possible but speculative, and even a perfectly sized sample produces a misleading aggregate over a heterogeneous corpus.",
    B: "Correct, and it points at the better product decision: auto-approve the fields that are reliably extracted, review the rest, and shrink the queue without raising error rates.",
    C: "A defensible opinion but not the technical point, and it forecloses the per-field approach that actually solves the backlog.",
    D: "Wrong emphasis. Different metrics on the same undifferentiated aggregate hide exactly the same variation."
  }
},
{
  n: 38, domain: "PESO", topic: "Topic 7", sc: "S5", type: "multi",
  stem: "Atlas wants a feedback loop from its human review queue that actually improves the pipeline. Which TWO elements are essential to the design?",
  opts: {
    A: "A free-text note from the reviewer on every correction record, explaining what it was that went wrong.",
    B: "A dashboard showing the total number of corrections made each week, trended over time.",
    C: "A typed <code>error_class</code> on every correction, from a taxonomy mapping each class to one fix.",
    D: "Version identifiers for the prompt, schema and examples on every record, plus a regression eval set."
  },
  correct: ["C","D"],
  rule: "A feedback loop needs classification and attribution. Typed error classes convert individual corrections into a ranked backlog with a known fix for each class. Version identifiers let you tell your change from a model upgrade or a shift in document mix, and a regression eval set built from real corrections stops each fix from quietly breaking an earlier one.",
  why: {
    A: "Useful supporting detail but not essential and not sufficient. Prose cannot be aggregated or ranked, which is the whole point of the exercise.",
    B: "Wrong. A volume trend tells you whether things are getting better or worse, never which change would help. It is a monitoring artefact, not a feedback loop.",
    C: "Correct. Without a typed class you can see that errors exist but not whether they are a schema problem or a prompt problem — so you cannot choose an intervention.",
    D: "Correct, and the regression eval set is the most-forgotten half. Production corrections are the highest-value eval data available: real, human-labelled, and precisely the cases you fail."
  }
},
{
  n: 39, domain: "PESO", topic: "Topic 7", sc: "S5",
  stem: "Atlas aggregates a month of corrections. The largest cluster is <code>error_class: MISSING_ENUM_MEMBER</code> on <code>treatment_category</code>, concentrated in documents from three medical providers who have started using a new billing taxonomy. What is the correct intervention?",
  opts: {
    A: "Extend the enum with the new categories, checking whether the <code>\"other\"</code> rate had risen.",
    B: "Add a validation rule that rejects any document that falls into one of the three new categories.",
    C: "Route all documents from those three providers into the human review queue permanently.",
    D: "Add few-shot examples drawn from the documents produced by those three providers."
  },
  correct: ["A"],
  rule: "Each error class maps to exactly one intervention. <code>MISSING_ENUM_MEMBER</code> is a taxonomy gap and is fixed by extending the enum — which is also why a well-designed enum has an <code>\"other\"</code> member: its rate is the leading indicator that a real category is missing.",
  why: {
    A: "Correct on both halves. The retrospective check on the <code>\"other\"</code> rate is the part that improves the system rather than just this one field.",
    B: "Wrong direction entirely. The categories are legitimate; rejecting them converts a classification gap into a hard failure.",
    C: "Wrong. It concedes the automation goal over a change that takes one schema edit, and the same taxonomy will spread to other providers.",
    D: "Wrong intervention for this class. Examples cannot teach the model to emit a value the schema does not permit; it will still be coerced into the nearest listed member."
  }
},
{
  n: 40, domain: "PESO", topic: "Topic 5", sc: "S5",
  stem: "Atlas needs to guarantee that <code>claimed_amount</code> is never negative and that the sum of line items equals the stated total. An engineer proposes expressing both in the JSON schema. What is the correct assessment?",
  opts: {
    A: "Both should instead be expressed as plain instructions written into each of the field descriptions.",
    B: "Both can be expressed: use <code>minimum: 0</code> together with a computed cross-field constraint.",
    C: "Neither — numeric bounds and cross-field arithmetic belong in a post-parse validation layer.",
    D: "Only the cross-field rule can be expressed, and that is done by using <code>allOf</code> blocks."
  },
  correct: ["C"],
  rule: "Structured outputs support types, <code>enum</code>, <code>const</code>, <code>required</code>, <code>additionalProperties: false</code>, <code>anyOf</code>, <code>$ref</code>/<code>$defs</code> and standard string formats. They do <em>not</em> support numeric bounds (<code>minimum</code>/<code>maximum</code>), string length bounds, or cross-field arithmetic. Schemas constrain shape; business invariants are code.",
  why: {
    A: "Wrong as a guarantee. A description asking the model to check its own arithmetic is advisory. It is a reasonable supplement to the validator, never a replacement.",
    B: "Wrong. Unsupported schema keywords return a 400 error rather than being silently ignored, so this fails loudly at request time.",
    C: "Correct, and it is the layered architecture the exam wants: schema for shape, deterministic code for invariants, human review for what neither can settle.",
    D: "Wrong. <code>allOf</code> composes subschemas; it cannot express arithmetic relationships between sibling values."
  }
},
{
  n: 41, domain: "TDM", topic: "Topic 8", sc: "S4",
  stem: "Vantage's agent calls <code>search_knowledge_base</code> when a user asks \"is my account locked?\", and calls <code>check_account_status</code> with an email address when it should pass an employee ID. Both tools have one-line descriptions. What is the highest-value first fix?",
  opts: {
    A: "Switch to a larger model that has demonstrably better tool-selection performance in benchmarks.",
    B: "Rewrite both descriptions with explicit positive and negative scope, formats and examples.",
    C: "Add a routing instruction to the system prompt setting out when each of the tools should be used.",
    D: "Set <code>tool_choice: {\"type\":\"any\"}</code> so that the model always commits to some tool or other."
  },
  correct: ["B"],
  rule: "The model selects a tool using only its name, description and input schema. It cannot see your API docs, your implementation or your intent. Tool selection errors are therefore description errors first, and Anthropic calls the description \"by far the most important factor in tool performance\" — aim for 3-4 sentences minimum.",
  why: {
    A: "Wrong as a first move. It is expensive, it does not address the missing information, and a stronger model reading a one-line description still cannot know that emails are invalid input.",
    B: "Correct, and it fixes both reported symptoms at once: the negative scope stops the mis-selection, and the format specification stops the malformed input.",
    C: "Weaker. A routing instruction in the system prompt is distant from the decision point and gets diluted in long sessions, while the description sits immediately beside the schema the model is filling in.",
    D: "Wrong. <code>tool_choice</code> controls <em>whether</em> a tool is called, never <em>which</em>. Forcing a commitment does not make the commitment correct."
  }
},
{
  n: 42, domain: "TDM", topic: "Topic 9", sc: "S4",
  stem: "An engineer argues that setting <code>tool_choice: {\"type\":\"any\"}</code> will solve Vantage's tool mis-selection problem because \"it forces the model to be decisive\". Evaluate.",
  opts: {
    A: "Incorrect — <code>any</code> forces a tool call, not the right one; mis-selection is a design flaw.",
    B: "Correct, provided that <code>strict: true</code> has also been set on every one of the tools.",
    C: "Correct — forcing a tool call removes hesitation and improves the model's selection accuracy.",
    D: "Incorrect, because <code>any</code> is not supported once more than three tools are provided."
  },
  correct: ["A"],
  rule: "<code>tool_choice</code> governs invocation, not identity. <code>auto</code> lets the model decide whether to call anything; <code>any</code> requires a call but leaves the choice open; <code>tool</code> pins a specific tool. None of them improves discrimination between semantically similar tools — that is descriptions, consolidation and role scoping.",
  why: {
    A: "Correct, and the practical consequence is worth noting: forcing a call when the right answer was \"ask the user a clarifying question\" makes the behaviour worse, not better.",
    B: "Wrong. <code>strict: true</code> guarantees the <em>inputs</em> conform to the chosen tool's schema. A perfectly-formed call to the wrong tool is still the wrong call.",
    C: "Wrong. It confuses decisiveness with correctness. A model forced to pick among four confusable tools picks wrongly just as often, and now cannot decline.",
    D: "Factually wrong; there is no such limit. A fabricated technical constraint is a common distractor shape — be suspicious of options that invent restrictions."
  }
},
{
  n: 43, domain: "TDM", topic: "Topic 9", sc: "S1",
  stem: "Meridian needs every inbound message classified into one of nine intent categories, always as structured data, before routing. Currently the model sometimes replies conversationally instead. Which configuration guarantees the structured result?",
  opts: {
    A: "<code>tool_choice: {\"type\":\"any\"}</code> with the classification tool as the only tool provided to it.",
    B: "Post-processing code that parses the intent back out of the model's natural-language reply.",
    C: "<code>tool_choice: {\"type\":\"auto\"}</code> plus a system prompt instruction always to classify first of all.",
    D: "<code>tool_choice: {\"type\":\"tool\", \"name\":\"classify_intent\"}</code>, categories as an enum, <code>strict: true</code>."
  },
  correct: ["D"],
  rule: "When a specific tool must run, <code>tool_choice: {\"type\":\"tool\",\"name\":\"...\"}</code> guarantees the invocation and <code>strict: true</code> guarantees the inputs conform to the schema. An <code>enum</code> of valid categories closes the last gap. Together they turn a probabilistic behaviour into an API-level guarantee.",
  why: {
    A: "Works in practice when exactly one tool is supplied, and it is the closest wrong answer — but it expresses the constraint weakly. Add a second tool later and the guarantee silently evaporates. <code>tool</code> states the intent directly.",
    B: "Wrong. Parsing prose for structured data reintroduces every problem structured output exists to remove, and it fails silently on phrasings the parser has not seen.",
    C: "Wrong. <code>auto</code> plus an instruction is exactly the probabilistic arrangement that is already failing.",
    D: "Correct, and the enum matters: without it the model can return a schema-valid string that is not one of the nine categories."
  }
},
{
  n: 44, domain: "TDM", topic: "Topic 9", sc: "S2",
  stem: "Northwind's returns agent occasionally calls <code>process_return(order_id)</code> with an order ID that does not exist, having not called <code>lookup_order</code> first. Four fixes are proposed. Which provides the strongest guarantee?",
  opts: {
    A: "Add to <code>process_return</code>'s description: \"Requires an order_id from lookup_order. Do not call until you have one.\"",
    B: "Validate the precondition in the backend and return a <code>PRECONDITION_FAILED</code> error naming <code>lookup_order</code>.",
    C: "Add a rule to the system prompt stating that every return must always begin with an order lookup first.",
    D: "Make <code>lookup_order</code> return a stable <code>order_id</code> that the model is able to chain into the next call."
  },
  correct: ["B"],
  rule: "Structural over probabilistic, applied to sequencing. Descriptions and chainable identifiers make the right sequence likely; backend validation makes the wrong sequence impossible to complete. When a question asks which option <em>guarantees</em> something, the answer is the one enforced outside the model.",
  why: {
    A: "Genuinely helpful and worth doing — it is the cheap first fix — but it is advisory. The scenario says \"occasionally\", which is the signature of a probabilistic control operating correctly most of the time.",
    B: "Correct. It holds even when the model ignores every instruction, and the structured error teaches the recovery path rather than dead-ending the session.",
    C: "Weakest of the four. A system prompt rule is the same advisory mechanism as the tool-description hint, placed even further from the decision point.",
    D: "Also worth doing, and it reduces the failure rate by removing the temptation to construct an ID. It still does not prevent the model from skipping the lookup entirely."
  }
},
{
  n: 45, domain: "TDM", topic: "Topic 8", sc: "S4",
  stem: "Vantage's ticketing MCP tool returns <code>{\"error\": \"Operation failed\"}</code> when a ticket cannot be created. Observed agent behaviour: it retries non-retryable failures repeatedly, and in some sessions tells the user a ticket was created when it was not. Which error design best fixes both symptoms?",
  opts: {
    A: "A structured error with <code>errorCategory</code>, <code>isRetryable</code>, a message and a remediation hint.",
    B: "Suppressing the errors and returning an empty result so that the agent simply moves on regardless.",
    C: "Returning raw HTTP status codes and letting the model infer whatever meaning it can from them.",
    D: "A longer natural-language error message that explains the failure in far more detail."
  },
  correct: ["A"],
  rule: "An error message is a prompt — it is the model's only information about how to recover. Structured fields let the model branch correctly: <code>isRetryable: false</code> stops retry storms, an explicit category selects the right recovery, and the remediation names the next action. A bare \"failed\" implies nothing, so the model guesses.",
  why: {
    A: "Correct, and it addresses both symptoms directly: the retryable flag stops the retry loop, and an unambiguous failure signal removes any basis for claiming success.",
    B: "Wrong, and it is the silent-failure anti-pattern. Suppressing the error is what causes the second symptom: an agent with no failure signal reports success.",
    C: "Wrong. Bare status codes are ambiguous across APIs — a 403 might mean escalate, retry with different credentials, or stop — and they carry no remediation.",
    D: "Better than \"failed\" but still unstructured. Prose cannot be branched on reliably, and it invites the model to interpret rather than decide."
  }
},
{
  n: 46, domain: "TDM", topic: "Topic 8", sc: "S2",
  stem: "Northwind's returns subagent has 31 tools available, including <code>create_return</code>, <code>start_return</code>, <code>initiate_rma</code> and <code>open_return_case</code>, which do overlapping things in different legacy systems. Selection accuracy is poor. What is the strongest structural fix?",
  opts: {
    A: "Rename the tools alphabetically so that the model will consider them in a predictable order.",
    B: "Consolidate overlapping operations behind one tool with an <code>action</code> enum, and scope the tool set.",
    C: "Add a detailed decision tree to the system prompt setting out exactly when to use each of the four tools.",
    D: "Provide all 31 of the tools to every subagent so that any agent can handle any request."
  },
  correct: ["B"],
  rule: "Fewer, more capable tools reduce selection ambiguity. Consolidating related operations behind an <code>action</code>/<code>system</code> parameter and scoping the visible catalogue per agent role are the two structural levers; namespacing names by service is the third. More tools monotonically increases mis-selection and context cost.",
  why: {
    A: "Wrong. Tool order is not a selection mechanism, and the premise is invented.",
    B: "Correct on both halves — consolidation removes the ambiguity, role scoping removes the tools that were never relevant to returns in the first place.",
    C: "A useful supplement but not structural. A prompt-level decision tree over four confusable tools still relies on the model traversing it correctly every time, and it grows unmaintainable as legacy systems are added.",
    D: "Wrong, and it is the explicit anti-pattern: it maximises selection ambiguity, wastes context on 31 tool definitions, and widens the blast radius of every agent."
  }
},
{
  n: 47, domain: "TDM", topic: "Topic 9", sc: "S1",
  stem: "Meridian's dispute flow ends with a summary turn: after all lookups are complete, the agent must produce a plain-language explanation for the customer and must not take any further action. What is the correct configuration for that final turn?",
  opts: {
    A: "<code>tool_choice: {\"type\":\"none\"}</code> on the final summarisation call.",
    B: "<code>tool_choice: {\"type\":\"auto\"}</code> with a prompt instruction not to use tools.",
    C: "Remove the tools from the request and set <code>tool_choice: {\"type\":\"any\"}</code>.",
    D: "Omit <code>tool_choice</code> and rely on the model to stop calling tools."
  },
  correct: ["A"],
  rule: "<code>none</code> prevents any tool from being called for that request. It is the deterministic way to force a natural-language turn with no side effects — and in a banking flow, \"no side effects\" is a real requirement, not a stylistic preference.",
  why: {
    A: "Correct, and it composes cleanly with the staged pattern: force a specific tool early, allow any tool in the middle, forbid tools at the end.",
    B: "Wrong. It is the probabilistic version of a guarantee the API gives you directly, and the cost of one stray tool call here is a duplicate refund.",
    C: "Incoherent: <code>any</code> requires a tool call while no tools are provided. Removing the tools alone would work, but it forces you to rebuild the request and invalidates the cached tool definitions.",
    D: "Wrong. Omitting <code>tool_choice</code> defaults to <code>auto</code> whenever tools are supplied, so a stray refund call remains possible."
  }
},
{
  n: 48, domain: "TDM", topic: "MCP", sc: "S6",
  stem: "Corvus wants every engineer to get the same GitHub and internal-metrics MCP servers automatically, without committing any credentials. Which configuration is correct?",
  opts: {
    A: "Have each engineer add the servers to their own personal <code>~/.claude.json</code> with their tokens pasted in.",
    B: "Commit <code>.mcp.json</code> with the server definitions, referencing credentials as <code>${GITHUB_TOKEN}</code>.",
    C: "Configure the servers through <code>CLAUDE.md</code> so that they load along with the project instructions.",
    D: "Commit <code>.mcp.json</code> with the tokens included, and rely on the repository being private."
  },
  correct: ["B"],
  rule: "<code>.mcp.json</code> at the project root is the team-shared, version-controlled server configuration — that is its purpose. Secrets are referenced through environment-variable substitution, never embedded. Personal servers live in <code>~/.claude.json</code>; org-wide control uses managed <code>allowedMcpServers</code> / <code>deniedMcpServers</code>.",
  why: {
    A: "Wrong for the stated goal. It works but defeats standardisation entirely: 400 engineers configuring servers by hand produces 400 slightly different setups and a permanent onboarding cost.",
    B: "Correct. Every engineer gets the definitions on checkout, and each supplies their own token through the environment.",
    C: "Factually wrong. CLAUDE.md carries instructions, not MCP server configuration.",
    D: "Wrong. A private repository is not a secret store — it is cloned to every laptop, mirrored into CI, and searchable by everyone with read access. This is an automatic fail."
  }
},
{
  n: 49, domain: "TDM", topic: "Topic 9", sc: "S4",
  stem: "A Vantage session needs the employee record, the asset assigned to that employee, and the client tenant's software-install policy. The asset lookup requires the employee ID returned by the employee lookup; the policy lookup requires only the tenant ID, which is already known. How should these be sequenced?",
  opts: {
    A: "All three strictly in sequence, with <code>disable_parallel_tool_use: true</code> on the request.",
    B: "All three of them in parallel within a single turn, for the minimum possible latency overall.",
    C: "Employee lookup and policy lookup in parallel, then asset lookup once the ID is known.",
    D: "Asset lookup first, on the grounds that it is the one call with a dependency."
  },
  correct: ["C"],
  rule: "Parallelise independent calls, sequence dependent ones. Parallelism is a latency win where there is no data dependency and a correctness bug where there is. Map the dependency graph, then batch each independent layer into one turn.",
  why: {
    A: "Wrong. It is safe but needlessly slow, adding a round trip for no correctness benefit. <code>disable_parallel_tool_use</code> exists for genuinely ordered side effects, not as a default.",
    B: "Wrong. The asset lookup has no employee ID to use, so it either errors or the model invents one. This is precisely the sequencing failure the objective targets.",
    C: "Correct — it is the optimal schedule: two round trips instead of three, with the dependency respected.",
    D: "Wrong. It inverts the dependency: the asset lookup is the call that must come <em>after</em>, not before."
  }
},
{
  n: 50, domain: "TDM", topic: "Topic 9", sc: "S1",
  stem: "Meridian sets <code>tool_choice: {\"type\":\"tool\", \"name\":\"verify_identity\"}</code> for the first turn of every session. QA files a bug: \"the agent no longer greets the customer or explains what it is doing before verifying identity, despite the prompt telling it to.\" What is the correct response?",
  opts: {
    A: "A prompt bug — the greeting instruction in the system prompt simply needs strengthening.",
    B: "A regression in the API itself; the right response here is to file a support ticket.",
    C: "Expected — forced tool use prefills the assistant turn; use <code>auto</code>, or greet from a separate turn.",
    D: "Set <code>disable_parallel_tool_use: false</code> so that plain text is permitted alongside the tool call itself."
  },
  correct: ["C"],
  rule: "With <code>tool_choice</code> set to <code>any</code> or <code>tool</code>, the API prefills the assistant message to force a tool call. The model therefore emits no preamble text before the <code>tool_use</code> block, even when explicitly instructed to. If you need commentary, use <code>auto</code> and ask for the tool in the user message.",
  why: {
    A: "Wrong. No prompt strengthening can override a prefilled assistant turn; the instruction is unsatisfiable under this configuration.",
    B: "Wrong. It is documented behaviour, not a regression.",
    C: "Correct, and it gives both remedies. In a banking flow, keeping identity verification guaranteed is usually worth more than the greeting, so emitting the greeting from the orchestrator is often the cleaner fix.",
    D: "Wrong. Parallel tool use governs how many tools can be called in one turn; it has nothing to do with preamble text."
  }
},
{
  n: 51, domain: "TDM", topic: "Topic 8", sc: "S2", type: "multi",
  stem: "Northwind's <code>search_orders</code> tool returns every matching order in full, sometimes 400 records with all line items. Sessions that call it degrade badly afterwards: the agent loses the thread and mis-selects subsequent tools. Which TWO changes address this?",
  opts: {
    A: "Paginate the response with metadata (<code>total</code>, <code>has_more</code>, <code>next_cursor</code>) and return a page.",
    B: "Add a <code>PostToolUse</code> hook that truncates every tool output down to the first 2,000 characters.",
    C: "Return only high-signal fields plus stable identifiers to chain into <code>get_order_details</code>.",
    D: "Increase the context window so that the full result set fits inside it comfortably."
  },
  correct: ["A","C"],
  rule: "Tool responses should return only high-signal information: bounded pages, stable semantic identifiers, and the fields needed to reason about the next step. Bloated responses waste context and bury the next action. This is a tool-design defect, not a context-window limitation.",
  why: {
    A: "Correct. Pagination with metadata lets the agent know more exists and fetch it deliberately, rather than receiving everything and drowning.",
    B: "Wrong. Blind truncation cuts mid-record, produces malformed data, and silently discards results the agent may need, with no signal that anything was dropped.",
    C: "Correct, and it is the half that enables good chaining: returning <code>order_id</code> values means the agent can call <code>get_order_details</code> for the one order that matters instead of reasoning over 400 full records.",
    D: "Wrong. Attention dilutes long before the window fills — the exam's named anti-pattern. A bigger window makes the same problem more expensive."
  }
},
{
  n: 52, domain: "CMR", topic: "Topic 4", sc: "S1",
  stem: "A Meridian customer types \"stop, I want to speak to a real person\". The agent has already verified identity, confirmed the duplicate charge, and is one tool call from issuing a $22 refund that is within its authority. What should it do?",
  opts: {
    A: "Escalate only if the customer repeats the request after having been offered a resolution first.",
    B: "Complete the refund first, since it takes one call and fully resolves the issue, then confirm to the customer.",
    C: "Escalate immediately, attaching the verified facts and the prepared refund for the human to complete.",
    D: "Ask the customer whether they would rather the agent finished it off, given it is nearly done."
  },
  correct: ["C"],
  rule: "An explicit request for a human is honoured immediately and unconditionally — not after one more tool call, not after an offer to help first, not conditional on the agent judging the request unnecessary. The correct implementation escalates <em>and</em> attaches everything gathered, so the transfer is both fast and warm.",
  why: {
    A: "Wrong. Requiring a repeat request is deliberate friction, and in regulated and accessibility contexts it is indefensible.",
    B: "Wrong, and the most tempting option because it produces the best-looking metrics. Taking an unrequested financial action after the customer asked you to stop is exactly the behaviour that turns a routine transfer into a complaint.",
    C: "Correct. It respects the customer's decision while preserving the agent's work, which is the design target: minimise human handling time after escalation, not escalation rate.",
    D: "Wrong. It is deflection with a question mark. The customer already answered this question."
  }
},
{
  n: 53, domain: "CMR", topic: "Topic 4", sc: "S1",
  stem: "Meridian's current escalation rule is: escalate when the model's self-reported confidence in its answer falls below 0.7. Risk engineering wants it replaced. Which criticism is the strongest technical objection?",
  opts: {
    A: "Self-reported confidence is uncalibrated, overconfident out of distribution, unauditable, and drifts.",
    B: "Confidence scores cannot be logged in any form that satisfies the compliance team's requirements.",
    C: "Computing a confidence score adds measurable extra latency to every one of the sessions the agent handles.",
    D: "0.7 is simply the wrong threshold; it ought to be tuned per intent category instead of globally."
  },
  correct: ["A"],
  rule: "Model self-reported confidence is not a calibrated probability. It is highest precisely where you need it lowest — on unfamiliar requests — and because it is produced by the model, any prompt edit or model upgrade can move your escalation rate with no code change and no alert. Replace it with deterministic triggers evaluated from observable state.",
  why: {
    A: "Correct on all four counts, and the drift point is the operational killer: your escalation rate becomes a function of prompt wording rather than business conditions.",
    B: "Factually wrong — the score can be logged. Logging it does not make it meaningful, which is the actual issue.",
    C: "Wrong and trivial. Latency is not why the design is unsound, and it would not change if the score were free.",
    D: "Wrong. Tuning the threshold of an uncalibrated signal produces a better-tuned uncalibrated signal. The problem is the axis, not the cut point."
  }
},
{
  n: 54, domain: "CMR", topic: "Topic 4", sc: "S3",
  stem: "Helix's incident agent has, over six turns, called the same three diagnostic tools twice each with identical arguments and identical results, and the incident state is unchanged. How should this be detected and handled?",
  opts: {
    A: "Increase the turn budget so that the agent has more opportunity to find a fresh angle on it.",
    B: "Detect it deterministically by comparing tool-call signatures across turns, then escalate.",
    C: "Ask the model on each turn whether it feels it is making progress, and escalate when it says no.",
    D: "Restart the session with a fresh context so that the agent tries a different approach."
  },
  correct: ["B"],
  rule: "\"No measurable progress\" is a deterministic escalation trigger, and the emphasis is on <em>measurable</em>. Repeating identical tool calls with identical results and unchanged state is observable from the orchestrator without asking the model anything. The escalation carries the diagnostics so the on-call engineer does not repeat them.",
  why: {
    A: "Wrong. More turns of an agent that is looping produces more identical calls, more cost, and more SLA burn on a SEV-1.",
    B: "Correct. It is observable, testable, loggable and auditable — the four properties that self-assessment lacks.",
    C: "Wrong. Model self-assessment of progress is the same unreliable class as self-reported confidence, and it costs a turn to obtain.",
    D: "Wrong. A fresh context discards the diagnostics already gathered — the only valuable output of the session so far — and the agent is likely to reproduce the same loop from the same starting point."
  }
},
{
  n: 55, domain: "CMR", topic: "Topic 4", sc: "S1",
  stem: "Meridian's $50 auto-approval limit is currently stated in the agent's system prompt. A red-team exercise shows a crafted customer message can persuade the agent to issue a $300 refund. Where must the limit live?",
  opts: {
    A: "In the <code>issue_refund</code> backend, which checks the tier and returns <code>PERMISSION_DENIED</code>.",
    B: "In a <code>PostToolUse</code> check that reverses any refund that gets issued above the limit.",
    C: "In the system prompt, restated far more firmly and then repeated again at the very end of it.",
    D: "In the tool's <code>input_schema</code>, as a <code>maximum: 50</code> constraint on the amount field itself."
  },
  correct: ["A"],
  rule: "Authority envelopes are enforced in backend tool logic, never in the prompt. Anything the model can be talked out of is not a control. A structured refusal also keeps the session productive: the agent escalates with the refund pre-assembled rather than dead-ending.",
  why: {
    A: "Correct. The limit holds regardless of prompt injection, prompt edits, model upgrades or a jailbroken conversation, because the model is not the thing enforcing it.",
    B: "Wrong. Reversing a refund after it is issued is a customer-visible incident and, for many payment rails, not cleanly reversible at all. Prevention, not compensation.",
    C: "Wrong. The red-team exercise already demonstrated that prompt-level constraints are defeasible; restating the defeated control more firmly is not a fix.",
    D: "Wrong on the mechanism, and a tempting near-miss. Numeric bounds like <code>maximum</code> are not supported in structured/strict schemas, and even if they were, a schema constraint is enforced at the model boundary rather than at the money-moving boundary."
  }
},
{
  n: 56, domain: "CMR", topic: "Topic 1 · 4", sc: "S2", type: "multi",
  stem: "Northwind is designing the escalation payload handed to human agents. The goal is to minimise human handling time. Which TWO elements belong in it?",
  opts: {
    A: "The agent's own self-assessed confidence in its reading of the customer's request.",
    B: "Verified facts with the tool that produced each, plus actions attempted and their outcomes.",
    C: "A machine-readable escalation reason code, together with one concrete suggested next step.",
    D: "The complete raw conversation transcript, including the agent's reasoning, for full context."
  },
  correct: ["B","C"],
  rule: "A good handoff is decision-ready: facts with provenance, what was tried, why it stopped, and what to do next. Carry facts forward and drop the narrative. The metric that matters is human handling time after escalation, not escalation rate.",
  why: {
    A: "Wrong. An uncalibrated confidence score in a decision packet is worse than no number at all, because it anchors the human's judgement on a signal that means nothing.",
    B: "Correct. Provenance is what lets the human trust a fact without re-verifying it, and the attempt log stops them repeating work the agent already did.",
    C: "Correct. The reason code makes escalations aggregatable for the feedback loop; the suggested next step turns a re-investigation into an approval click.",
    D: "Wrong. A human under SLA pressure will not read a long transcript, and the reasoning chain is unverified intermediate output. It increases handling time, which is the opposite of the goal."
  }
},
{
  n: 57, domain: "CMR", topic: "Context", sc: "S3",
  stem: "A Helix SEV-1 session has run four hours. Engineers notice the agent has started contradicting facts established early on — misstating which service was rolled back and when the error rate spiked. What is the most robust mitigation?",
  opts: {
    A: "Increase the context window so that the entire four-hour incident history stays in context throughout.",
    B: "Disable compaction entirely, so that no information whatever is ever summarised away.",
    C: "Extract established facts into a state block kept outside the history and re-injected each turn.",
    D: "Ask the agent to re-read the whole conversation and correct itself again on each turn."
  },
  correct: ["C"],
  rule: "Long-session fact drift is fixed by moving durable facts out of the narrative and into structured state that you control, then placing it where attention is strongest. Progressive summarisation compresses the story; structured extraction preserves the facts. Bigger windows do not fix attention dilution.",
  why: {
    A: "Wrong. This is the named anti-pattern: attention dilutes long before the window fills, and a four-hour transcript in context is where the lost-in-the-middle effect is strongest.",
    B: "Wrong, and it makes things worse. Retaining everything maximises dilution and cost; the problem is not that information was lost, it is that critical facts are buried.",
    C: "Correct. The incident state — affected service, timeline, actions taken, current hypothesis — is a small structured object your orchestrator owns and can guarantee is accurate.",
    D: "Wrong. Self-review over the same diluted context reproduces the same errors, and it burns turns on a SEV-1."
  }
},
{
  n: 58, domain: "CMR", topic: "Topic 4", sc: "S1",
  stem: "After a routine prompt revision, Meridian's escalation rate moved from 12% to 34% overnight with no change in traffic mix or in any business rule. What does this reveal about the design?",
  opts: {
    A: "The escalation tool's description simply needs clarifying and expanding a good deal.",
    B: "The model version changed at the same time, and it should therefore have been pinned.",
    C: "The new prompt is simply more cautious, and that is a safety improvement that is worth keeping.",
    D: "Escalation is decided by the model, not by deterministic logic; hard triggers belong in code."
  },
  correct: ["D"],
  rule: "A prompt edit should not be able to move an escalation rate threefold. If it can, escalation is a probabilistic model behaviour rather than a policy decision. Move the hard triggers — explicit request, authority exceeded, policy gap, tool failure, no progress — into orchestration code, and the rate becomes a function of business conditions with prompt changes affecting only conversation quality.",
  why: {
    A: "Wrong. Clarifying the tool description might shift the rate again — in an unpredictable direction — which is the same problem restated.",
    B: "Plausible and worth ruling out, but the scenario states the prompt was the change. Even if pinning helped, it would not fix the underlying fragility.",
    C: "Wrong. Uncontrolled 3x growth in human workload is not a safety improvement; it is a capacity incident, and nobody chose it.",
    D: "Correct. The magnitude of the swing is the diagnostic: it tells you where the decision actually lives, regardless of where the design document says it lives."
  }
},
{
  n: 59, domain: "CMR", topic: "Context", sc: "S4",
  stem: "Vantage summarises long service-desk sessions before handing them to a second agent for follow-up. Follow-up agents frequently miss constraints that were stated mid-conversation, such as \"this laptop cannot be reimaged before Friday\". Which change most improves this?",
  opts: {
    A: "Make the handoff summary longer so that far fewer details are lost along the way.",
    B: "Pass the entire conversation through to the next agent instead of a summary of it.",
    C: "Extract constraints and commitments into a structured block at the start of the handoff.",
    D: "Have the follow-up agent simply ask the user to restate any of their constraints at the start."
  },
  correct: ["C"],
  rule: "Summaries compress narrative and lose specifics. Constraints, commitments and decisions are exactly the content that must not be compressed, so extract them into structured fields and place them where attention is strongest — at the start of the input, not buried mid-document.",
  why: {
    A: "Weak. A longer summary is still prose, still lossy in unpredictable places, and it costs more context. Length is not the variable that protects a specific constraint.",
    B: "Wrong. It reproduces the original dilution problem and costs the most tokens. The whole point of the handoff is to carry facts, not narrative.",
    C: "Correct on both counts: structure prevents compression loss, and position mitigates the lost-in-the-middle effect.",
    D: "Wrong, and user-hostile: it makes the customer repeat information they already provided, which is the failure the scenario is complaining about."
  }
},
{
  n: 60, domain: "CMR", topic: "Topic 4", sc: "S1",
  stem: "A product manager proposes: \"run sentiment analysis on every message; when frustration is detected, escalate automatically.\" What is the correct architectural position?",
  opts: {
    A: "Reject it entirely, on the grounds that sentiment has no place in a support system.",
    B: "Adopt it as the primary escalation gate — frustrated customers are the ones who most need a human.",
    C: "Adopt it, but only in those cases where the sentiment classifier's confidence exceeds 0.9.",
    D: "Use it as supplementary routing metadata for the human, never as the escalation gate itself."
  },
  correct: ["D"],
  rule: "Sentiment is an unreliable gate: it misfires on terse writers, non-native speakers and calmly-worded serious complaints, and it can be gamed. It is genuinely useful as prioritisation and as context for the human who takes over. Gates must be deterministic and observable; metadata can be probabilistic.",
  why: {
    A: "Overcorrects. Sentiment has real value in routing and in preparing the human; the error is only in using it as the gate.",
    B: "Wrong. It makes a probabilistic classifier the control plane for human staffing, so classifier drift becomes an unannounced change to your escalation policy.",
    C: "Wrong. Adding a confidence threshold to an unreliable trigger stacks two probabilistic signals and calls the result a rule — the self-reported-confidence anti-pattern applied to a classifier.",
    D: "Correct, and it keeps the value without the failure mode: a frustration signal can raise queue priority and warn the human, while the decision to escalate stays with the hard triggers."
  }
}
];
