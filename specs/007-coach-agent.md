# Coach Agent

**Status: Concept** -- not yet approved for implementation.
**Issue: [#7](https://github.com/openlearnapp/openlearnapp.github.io/issues/7)**

## Purpose

Give every workshop an intelligent coaching backend -- an AI-powered agent that understands the full workshop content, tracks learner progress, provides personalized feedback, and generates custom practice material. The coach works alongside human coaches, not instead of them.

## How It Works

The coach is powered by a Service Agent (SA) deployed as an external service. The platform stays static. Workshop creators configure a coach endpoint in their workshop metadata, along with the coach's personality (e.g. "encouraging", "concise") and the learning objectives for the workshop.

When a learner connects to the coach, the platform sends the full curriculum context -- all lessons, sections, examples, answer keys, labels, and vocabulary items -- so the agent has complete knowledge of what is being taught and where the learner is in the curriculum.

## Chat Interface for Learners

Learners interact with the coach through a chat interface within the platform. They can ask questions about lesson content ("Why do we use 'going to' instead of 'will'?"), request explanations for concepts they find difficult, or practice conversations using vocabulary they have learned. The coach responds with awareness of the full workshop content and the learner's history.

## Assessment Feedback

After completing assessments, learners can request feedback from the coach. The coach receives structured assessment data, analyzes patterns (which areas are weak, which concepts are confused), and returns specific explanations for incorrect answers. It suggests which lessons or sections to revisit based on the mistakes.

## Generated Practice Lessons

When a learner struggles with specific topics, the coach generates additional practice material targeting those weak areas. The generated content follows the same YAML structure as regular lessons, so the platform renders it natively with full interactivity. The difficulty adjusts to the learner -- simpler examples for those who are struggling, harder ones for advanced learners.

## Workshop Creator Configuration

Workshop creators set up the coach by providing: a Service Agent API endpoint, the coach's name and personality, the source and target language (for language workshops), and the learning objectives for the workshop. The platform sends the full workshop content to the SA on initialization so it can coach with complete curriculum awareness.

## Creator Feedback Loop

The coach acts as a bridge between learners and workshop creators. It aggregates learning insights ("80% of learners struggle with lesson 3, section 2"), surfaces content suggestions ("Consider adding more examples for modal verbs"), and can report content errors. These insights can be delivered as GitHub issues in the workshop repository.

## Human and AI Coaching

The API contract is the same whether the coach is a human, an AI agent, or a hybrid. The platform does not need to know which type is responding. This supports scenarios where AI handles routine questions and escalates complex ones to a human coach, or where a human coach reviews AI-drafted feedback before it reaches the learner.

## Open Questions

- Should the coach support multi-workshop context (one agent coaching across workshops)?
- How should session persistence work across devices?
- What guardrails are needed for AI-generated practice content quality?
