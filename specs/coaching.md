# Coaching

## Purpose

Every workshop can optionally offer coaching to its learners. Coaching connects learners with someone (or something) that can give feedback, answer questions, and guide their learning. The workshop creator decides what level of coaching to offer — from simple email contact to a fully automated AI coach.

The Open Learn platform provides the technical integration. The coaching itself happens outside the platform — the workshop creator is responsible for the backend, the AI, and the costs.

## Three Levels of Coaching

### Level 1: Email Coach

The simplest option. The workshop creator provides an email address. Learners can send their assessment results to the coach via email. The coach reviews them manually and responds.

This requires no backend, no API, no infrastructure. Just a human who reads emails.

### Level 2: API Coach

The workshop creator provides an API endpoint. Assessment results are sent automatically when the learner gives consent. The coach (human or system) receives structured data and can respond however they choose.

This enables:
- Automated collection of learner results
- Dashboards and analytics on the coach's side
- Programmatic responses (e.g. auto-generated feedback emails)

### Level 3: AI Coach

The workshop creator provides a Service Agent (AI) behind the API endpoint. The AI coach can do everything an API coach does, plus:
- Provide instant feedback on assessments
- Generate custom practice lessons
- Suggest individual learning paths
- Answer questions about lesson content

See `specs/coaching-ai-agent.md` for details on AI coach capabilities.

## Privacy and Consent

Coach forwarding is disabled by default. The learner must explicitly opt in via Settings. Until consent is given, no data leaves the browser — regardless of whether the workshop has a coach configured.

The learner can optionally provide a name or email to identify themselves. This is entirely voluntary. Consent can be revoked at any time — queued data is discarded.

## How Results Are Sent

Assessment answers are queued in memory as the learner works through a lesson. The batch is sent as a single request, giving the coach a complete picture of the learner's work.

Sending is triggered when the learner clicks "Send to Coach" or navigates away from a lesson. A sendBeacon fallback ensures delivery if the browser tab is closed.

## Workshop Creator Configuration

The workshop creator configures coaching in their workshop metadata:

- **Email coach**: provide a contact email address
- **API / AI coach**: provide an API endpoint URL, optional coach display name

The platform detects the configuration and shows the appropriate UI — an email link, a "Send Results" button, or a full coaching interface.
