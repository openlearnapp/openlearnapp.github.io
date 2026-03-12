# Coach Agent Concept

> Spec for an autonomous learning coach built on the Service Agent (SA) architecture.
> Related: [Issue #45](https://github.com/felixboehm/open-learn/issues/45), [ADR 006](adr/006-coach-as-optional-external-service.md)

## Vision

Every workshop gets an intelligent coaching backend — an autonomous agent that understands the workshop content, tracks learner progress, gives personalized feedback, generates custom exercises, and surfaces insights back to workshop creators. Works alongside human coaches, not instead of them.

---

## 1. Workshop Data Requirements

For a Service Agent to function as a learning coach, it needs structured context about the workshop. Workshop creators provide this when setting up their SA.

### 1.1 Required Workshop Metadata

The SA must be initialized with the full workshop content so it can give informed feedback:

| Data | Source | Purpose |
|------|--------|---------|
| **Workshop YAML** (topics.yaml, lessons.yaml, all content.yaml) | Workshop repo | Full curriculum knowledge — questions, answers, sections, labels |
| **Learning objectives** | New field in topics.yaml | What the learner should know after completing the workshop |
| **Difficulty progression** | Implicit from lesson order | Understanding where a learner is in the curriculum |
| **Assessment answer keys** | content.yaml examples | Validating and explaining correct/incorrect answers |
| **Label taxonomy** | content.yaml labels | Understanding grammar categories, topic areas |
| **Relation items** (`rel`) | content.yaml examples | Vocabulary/concept graph for targeted feedback |

### 1.2 New Workshop Configuration

Extend `topics.yaml` (or `workshops.yaml` for bundled workshops):

```yaml
topics:
  - folder: englisch
    code: en-US
    title: Englisch lernen
    description: 10 Lektionen zu den 30 wichtigsten englischen Verben
    objectives:                          # NEW
      - "Use 30 core English verbs in present, past, and future tense"
      - "Form basic sentences for daily communication"
      - "Understand modal verbs (can, must, should)"
    coach:
      api: "https://sa.example.com/coach/english"
      name: "English Coach"
      personality: "encouraging"         # NEW: tone of responses
      source_language: "de-DE"           # NEW: learner's native language
      target_language: "en-US"           # NEW: language being learned
      creator_repo: "felixboehm/workshop-english"  # NEW: for issue creation
```

### 1.3 SA Initialization Payload

On first connection, the platform sends the full workshop context to the SA:

```json
{
  "type": "init",
  "workshop": {
    "title": "Englisch lernen",
    "objectives": ["..."],
    "source_language": "de-DE",
    "target_language": "en-US",
    "lessons": [
      {
        "number": 1,
        "title": "Essential Verbs",
        "sections": [
          {
            "title": "to be",
            "explanation": "...",
            "examples": [
              { "q": "I am a teacher.", "a": "Ich bin Lehrer.", "labels": ["Simple Present"], "rel": [["am", "bin", "to be"]] }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 2. Coach Agent Features

### 2.1 Assessment Feedback

**Current**: Assessment results are sent as plain text context with chat messages.

**Enhanced**:
- SA receives structured assessment data (not just text)
- Analyzes patterns: which grammar areas are weak, which verbs are confused
- Gives specific explanations for incorrect answers
- Suggests which lessons/sections to revisit

```
Learner: "I got lesson 3 wrong a lot"
Coach: "I can see you're mixing up 'must' and 'should'. 'Must' (müssen)
expresses necessity — 'I must go' means you have no choice. 'Should'
(sollen) is a recommendation — 'You should rest' is advice.
Try these practice sentences: ..."
```

### 2.2 Custom Lesson Generation

The SA can generate additional practice material tailored to the learner:

- **Targeted exercises**: Based on weak areas identified from assessments
- **Difficulty adjustment**: Simpler examples for struggling learners, harder for advanced
- **Format**: Returns YAML matching the existing lesson schema so the platform can render it natively

```json
// POST to coach API
{
  "type": "generate_lesson",
  "focus": ["modal-verbs"],
  "weak_items": ["must", "should"],
  "difficulty": "easier",
  "count": 6
}

// Response
{
  "type": "custom_lesson",
  "lesson": {
    "title": "Extra Practice: Must vs. Should",
    "sections": [
      {
        "title": "When to use 'must'",
        "explanation": "...",
        "examples": [
          { "q": "You ___ wear a seatbelt.", "a": "must", "type": "input" }
        ]
      }
    ]
  }
}
```

### 2.3 Conversational Coaching

The existing chat interface evolves into a richer coaching experience:

- **Explain concepts**: "Why do we use 'going to' instead of 'will'?"
- **Practice conversations**: Simulated dialogues using learned vocabulary
- **Pronunciation guidance**: Tips based on source/target language pair
- **Motivation**: Track streaks, celebrate milestones, encourage consistent practice
- **Suggestions**: Context-aware prompts based on current progress

### 2.4 Creator Feedback Loop

The SA acts as a bridge between learners and workshop creators:

- **Aggregated insights**: "80% of learners struggle with lesson 3, section 2"
- **Content suggestions**: "Consider adding more examples for modal verbs"
- **Bug reports**: "Example in lesson 5 has incorrect answer"
- **Delivery**: Creates GitHub issues in the workshop repo

```json
// SA creates issue via GitHub API
{
  "title": "Content suggestion: More modal verb examples needed",
  "body": "Based on coaching 12 learners:\n- 80% incorrect on must vs. should\n- Average 3 attempts before correct answer\n- Suggested additions: ...",
  "labels": ["coach-feedback", "content"]
}
```

---

## 3. Platform Extensions

### 3.1 Enhanced Coach API Contract

The current simple request/response contract evolves to support multiple interaction types:

```
POST /coach
Content-Type: application/json

{
  "type": "chat | assessment | generate_lesson | feedback",
  "session_id": "uuid",
  "learner": {
    "id": "anonymous-hash",
    "name": "optional"
  },
  "workshop_context": { ... },
  "payload": { ... }
}
```

**Response types**:

| Type | Response | Platform Action |
|------|----------|-----------------|
| `chat` | `{ "response": "text" }` | Display in chat |
| `assessment` | `{ "feedback": [...], "suggestions": [...] }` | Show per-answer feedback |
| `generate_lesson` | `{ "lesson": { YAML-compatible } }` | Render as interactive lesson |
| `feedback` | `{ "issues": [...] }` | Confirm issues created |

### 3.2 New Platform Features

#### Coach-Generated Lessons View

- New route: `/:learning/:workshop/coach/lesson`
- Renders SA-generated lessons using existing `LessonDetail.vue` components
- Stored in localStorage under `coachLessons`
- Marked as "Coach-generated" in the UI

#### Per-Answer Feedback

- After submitting assessments, learner can request coach feedback
- Coach explains each wrong answer with reference to the lesson material
- Shown inline on the `AssessmentResults.vue` page

#### Coach Status Indicator

- Shows whether coach is human, AI, or hybrid
- Displays coach availability (for human coaches)
- Connection status indicator in the navigation

#### Learner Profile for Coach

- Anonymous learner identifier (hash-based, no PII)
- Learning history summary sent with each request
- Preferred coaching style (detailed explanations vs. brief hints)

### 3.3 Human + AI Hybrid Coaching

The architecture supports both human and AI coaches transparently:

| Capability | Human Coach | AI Coach (SA) | Hybrid |
|-----------|-------------|---------------|--------|
| Assessment feedback | Manual review | Instant automated | AI drafts, human reviews |
| Custom lessons | Created manually | Generated on demand | AI generates, human curates |
| Chat | Real-time messaging | Instant responses | AI handles basics, escalates to human |
| Creator feedback | Direct communication | Automated issue creation | AI aggregates, human prioritizes |

The platform doesn't need to know which type — the API contract is the same. The SA endpoint could be:
- A Claude-based agent (autonomous)
- A human dashboard that receives and responds to messages
- A hybrid where AI handles routine questions and escalates complex ones

---

## 4. MVP Scope (workshop-english)

### 4.1 What to Build

1. **Coaching SA for workshop-english**
   - Deploy a Service Agent that has the full workshop-english content as context
   - Configure `coach.api` in workshop-english's `topics.yaml`
   - SA understands all 10 lessons, 30 verbs, German-English translation patterns

2. **Send assessments → get feedback**
   - Extend `useCoach.js` to send structured assessment data (not just text)
   - SA analyzes answers and returns per-answer explanations
   - Display feedback on AssessmentResults page

3. **Request custom lessons**
   - Add "Practice my weak areas" button in Coach view
   - SA generates a practice lesson in YAML format
   - Platform renders it as a temporary interactive lesson

4. **Bidirectional feedback**
   - Learner rates coach responses (helpful/not helpful)
   - Coach surfaces improvement suggestions as GitHub issues on `felixboehm/workshop-english`

### 4.2 Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SA runtime | External service (separate repo) | Platform stays static (ADR 001) |
| AI model | Claude API | Best for multilingual, instructional content |
| Auth | None (MVP) | Keep it simple, add later if needed |
| Session persistence | localStorage session ID | No server-side state needed |
| Custom lesson storage | localStorage | Consistent with existing data model |

### 4.3 Implementation Steps

1. **Create SA service** — Standalone service with Claude API, workshop content as system prompt
2. **Configure workshop-english** — Add `coach.api` endpoint to topics.yaml
3. **Extend useCoach.js** — Support structured payloads and multiple response types
4. **Add coach lesson view** — Render SA-generated lessons in the platform
5. **Add feedback UI** — Inline feedback on assessment results, issue creation flow
6. **Test with real learners** — Iterate on prompt engineering and UX

---

## 5. Future Considerations

- **Multi-workshop coaching**: One SA instance serving multiple workshops
- **Spaced repetition**: SA schedules review sessions based on forgetting curves
- **Voice interaction**: Combine with audio system for spoken practice
- **Peer learning**: SA facilitates learner-to-learner exercises
- **Analytics dashboard**: Aggregated learning insights for creators (separate from platform)
- **Offline coaching**: Pre-generated feedback bundles for offline use
- **Coach marketplace**: Workshop creators can choose from available coaching services
