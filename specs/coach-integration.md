# Coach Integration

## Purpose

The coach integration allows workshop creators to optionally connect a human or AI coach who receives learners' assessment answers. This enables personalized feedback, progress monitoring, and guided learning -- while keeping the learner fully in control of what data is shared.

## Optional Per-Workshop Coach

Each workshop can have a coach configured by the workshop creator. When a coach is present, a "Send Answers to Coach" option becomes available to learners. Workshops without a coach configured behave exactly as before -- all data stays local.

## Privacy and Consent

### Explicit Opt-In Required

Coach forwarding is disabled by default. The learner must explicitly enable it in Settings by toggling coach consent on. Until consent is given, no assessment data ever leaves the browser -- regardless of whether the workshop has a coach configured.

### Learner Identifier

The learner can optionally provide a name or email address that is included with their submissions. This helps the coach identify who sent the answers. The identifier is entirely optional and controlled by the learner.

### Revoking Consent

Consent can be withdrawn at any time by toggling the setting off. Once disabled, no further answers are forwarded and any queued answers are discarded.

## How Answers Are Sent

### Batch Forwarding

Answers are not sent one at a time. Instead, they are queued in memory as the learner works through a lesson. The entire batch is sent as a single request, reducing network overhead and giving the coach a complete picture of the learner's work on that lesson.

Batch sending is triggered:
- When the learner clicks "Send Answers to Coach" at the end of a lesson.
- Automatically when navigating away from a lesson.

### Page Close Fallback

If the learner closes the browser tab or navigates away from the app entirely, a lightweight fallback mechanism (sendBeacon) ensures queued answers are still delivered. This prevents data loss from unexpected page closes.

## Workshop Creator Configuration

Workshop creators configure the coach endpoint in their workshop metadata file. The configuration includes the coach API URL and an optional display name. The endpoint receives a structured payload containing the lesson context, all queued answers, a timestamp, and the learner's optional identifier.

If the coach endpoint rejects a submission (e.g. the learner is not enrolled), the system handles the error gracefully and can direct the learner to an enrollment page if one is configured.
