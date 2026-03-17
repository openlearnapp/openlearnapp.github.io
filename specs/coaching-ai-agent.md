# AI Coaching Agent

**Issue: [#7](https://github.com/openlearnapp/openlearnapp.github.io/issues/7)**

## Purpose

An AI coaching agent automates personalized learning support for a workshop. It uses the full workshop content — lessons, examples, answer keys, vocabulary, objectives — to provide feedback, generate practice material, and guide learners through an individual learning path.

The AI coach is provided and hosted by the workshop creator. The Open Learn platform integrates with it via an API. The platform stays static — all intelligence lives in the external agent.

## What an AI Coach Can Do

### Assessment Feedback (Priority 1)

After completing assessments, the learner can request feedback from the AI coach. The coach receives structured assessment data — the learner's answers alongside the expected answers, per question — and analyzes patterns (weak areas, recurring mistakes, confused concepts).

The feedback is shown **per answer inline** on the assessment results page, not just as a summary. Each incorrect answer gets a specific explanation referencing the lesson material. The coach returns:

- Specific explanations for incorrect answers, inline per question
- Praise for correct answers and progress
- Suggestions for which lessons or sections to revisit
- Pattern analysis ("You're mixing up 'must' and 'should' — here's the difference...")

This is the highest-value feature — it turns passive exercises into active learning with immediate, personalized guidance.

### Generated Practice Lessons (Priority 1)

The AI coach generates custom lessons targeting a learner's weak areas. These lessons follow the same structure as regular workshop lessons, so the platform renders them natively with full interactivity (assessments, audio, labels).

Use cases:
- **Repeat a topic**: "I want to practice modal verbs again"
- **Review recent learning**: "Generate a lesson covering the last 2 weeks"
- **Deepen a subject**: "I want harder exercises on passive voice"

Generated lessons are stored per user (not published to the workshop). Storage can use GunDB or the coach's backend — both approaches are valid.

### Individual Learning Path

Learners have different entry levels. The AI coach can offer an individual learning path — an ordered sequence of lessons with options to dive deeper into specific topics, grammar, or vocabulary.

The learning path is:
- **Per user** — each learner gets their own path
- **Adaptive** — the coach updates the path based on assessment results
- **Optional** — learners can follow the path or browse freely

A skill-level assessment can help determine the starting point. This assessment can be created by the workshop creator (manually or with AI help) as a regular lesson with assessments.

### Quick Help (Lower Priority)

Learners can ask the coach short questions about lesson content ("Why 'ser' and not 'estar' here?"). The coach responds with awareness of the full workshop and the learner's history.

This is useful but lower priority than automated feedback and lesson generation. A simple chat interface is sufficient — no complex conversation flows needed.

### Creator Feedback Loop

The AI coach acts as a bridge between learners and workshop creators. By aggregating data across learners, the coach can surface insights that help creators improve their workshops:

- **Content hotspots**: "80% of learners struggle with lesson 3, section 2"
- **Content suggestions**: "Consider adding more examples for modal verbs"
- **Error reports**: "Example in lesson 5 has an incorrect answer"

These insights can be delivered automatically as GitHub issues in the workshop repository, labeled for easy triage. This turns the coach into a continuous improvement engine for workshop content.

### Spaced Repetition (Future)

The coach can schedule review sessions based on forgetting curves — reminding learners to revisit material at optimal intervals. This could be integrated with the learning path or offered as standalone review lessons.

## Platform Integration

### What the Platform Provides

- A coaching UI (feedback view, generated lesson view, optional chat)
- Structured payloads to the coach API (assessment data, learner context, workshop content)
- Consent management (opt-in, identifier, revocation)
- Storage for generated lessons (localStorage or GunDB, per user)
- A coach button in the navigation for workshops that have a coach configured

### What the Platform Does NOT Provide

- The AI agent itself
- The API backend
- API keys or AI model access
- Payment processing (future consideration)

### Initialization

When a learner first connects to the coach, the platform sends the full workshop context as a structured payload: all lessons, sections, examples, answer keys, labels, vocabulary items (rel), objectives, and the learner's current progress (learned items, completed assessments, active lesson). This gives the agent complete curriculum awareness before the first interaction.

Each coaching session gets a unique session ID scoped to the workshop, allowing the agent to maintain conversational context across multiple interactions within the same session.

### Coach UI States

The coaching interface adapts based on configuration:

- **No coach configured**: no coaching UI shown
- **Email coach only**: contact link, "Send Results" via email
- **API/AI coach configured but no consent**: informative placeholder explaining what the coach can do and how to enable it
- **API/AI coach with consent**: full coaching interface (feedback, generated lessons, optional chat)

## Workshop Creator Configuration

The workshop creator configures the AI coach in their workshop metadata:
- API endpoint URL
- Coach name and personality (e.g. "encouraging", "concise", "strict but fair")
- Source and target language (for language workshops)
- Learning objectives for the workshop

See `specs/coaching-ai-agent-setup.md` for how to build and deploy an AI coaching agent.

## Monetization (Future)

An AI coach could be an optional paid add-on: free workshop, paid coaching. This is the workshop creator's decision. The platform does not handle payments initially but may offer payment integration in the future to enable the platform to participate in revenue.
