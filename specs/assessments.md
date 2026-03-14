# Assessments

## Purpose

The assessment system turns passive reading into active learning by letting learners interact with examples through different question formats. It provides immediate feedback, persists answers locally, and supports both graded and ungraded (survey) modes.

## Assessment Types

### Q&A (default)

The standard show/hide interaction. The learner sees a question and reveals the answer by clicking. No validation occurs -- this is for self-paced review.

### Input (free text)

The learner types an answer into a text field. If a correct answer is defined, the system validates the response with case-insensitive matching. Multiple accepted answers can be configured (e.g. "I am a teacher" and "I'm a teacher" are both correct).

### Multiple Choice (checkboxes)

The learner selects one or more options via checkboxes. Multiple options can be marked as correct. Each checkbox toggle gives immediate per-option feedback showing whether that specific selection is right or wrong.

### Select (radio buttons)

The learner picks exactly one option from a set of radio buttons. Only one option is correct.

## Interaction Model

### Click-to-Save

There are no submit buttons anywhere in the assessment system. Every answer is validated and saved the moment the learner interacts:

- **Input**: Saved when the learner presses Enter or moves focus away from the field.
- **Select**: Saved immediately when a radio button is clicked.
- **Multiple Choice**: Each option gives live feedback on toggle. The overall answer is saved when all correct options are selected (or on first click when no correct answers are defined).

### Visual Feedback

Correct assessments are indicated by:
- A green checkmark next to the question text.
- A green background and green left border on the card.

Incorrect responses show:
- **Input**: The correct answer displayed below the text field.
- **Select / Multiple Choice**: Green border on correctly selected options, red border on incorrectly selected options.

### Always Re-Editable

Answers are never locked. A learner can change their response at any time without needing to reset. The new answer simply replaces the previous one.

## Survey Mode

When an assessment has no correct answers defined (no `correct` markers on options, no answer text for input), it operates in survey mode. The learner's response is recorded without any validation or correctness feedback. This is useful for gathering opinions, self-reflections, or open-ended responses.

## Persistence

All answers are saved to the browser's localStorage and restored automatically when the learner returns. Each answer records the response value, whether it was correct, and when it was submitted. Data is scoped per workshop and lesson so answers from different workshops never interfere.
