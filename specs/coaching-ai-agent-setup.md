# Building an AI Coaching Agent

**Status: Draft** — The setup process depends on the Service Agent (SA) architecture which is still being defined. This spec focuses on the requirements an agent must fulfill. The concrete setup guide will follow once the SA integration is proven.

## Purpose

This spec describes the requirements for an AI coaching agent and how a workshop creator can build and deploy one. The goal is to make it as simple as possible — ideally a reusable standard agent that works with any Open Learn workshop out of the box.

## The Service Agent Approach

An AI coaching agent is a Service Agent (SA) — an AI-powered backend service that receives workshop data and learner interactions, and responds with feedback, lessons, and guidance.

The SA concept was developed as a generic framework for AI agents that can be specialized for different use cases. A coaching agent is one such specialization: the SA uses the workshop content as its knowledge base and the learner's progress as context.

## What the Agent Receives

The platform sends structured data to the agent:

- **Workshop content**: all lessons, sections, examples, answer keys, labels, vocabulary items, and learning objectives
- **Learner context**: current progress (learned items, completed assessments), active lesson, and the learner's optional identifier
- **Request type**: what the learner is asking for (assessment feedback, lesson generation, learning path, or a question)
- **Assessment data** (when requesting feedback): the learner's answers alongside the expected answers, per question

## What the Agent Returns

Depending on the request type:

- **Assessment feedback**: text with explanations, praise, and suggestions for next steps
- **Generated lesson**: lesson content in the same YAML structure the platform uses — the platform renders it natively
- **Learning path**: an ordered list of recommended lessons (existing or to-be-generated) with optional branching for deeper topics
- **Chat response**: a text answer to a learner's question

## Standard Reusable Agent

To lower the barrier for workshop creators, a standard coaching agent should be available that works with any Open Learn workshop without custom development.

The standard agent:
- Accepts the workshop content on initialization and builds its knowledge base automatically
- Handles all request types (feedback, lesson generation, learning path, chat)
- Uses the workshop's configured personality and language settings
- Can be deployed as a hosted service or self-hosted by the creator

A workshop creator who wants custom behavior can fork the standard agent and modify it, or build their own from scratch — the API contract is the same.

## API Contract

The agent exposes a single endpoint that accepts JSON payloads. The payload includes a `type` field indicating the request type and the relevant context data. The response format depends on the request type.

The same API contract works for human coaches, AI agents, and hybrid setups. The platform does not need to know what is behind the endpoint.

## Deployment Options

- **Hosted service**: a managed instance of the standard agent (future platform offering)
- **Self-hosted**: the workshop creator deploys the agent on their own infrastructure
- **Serverless**: deploy as a cloud function (AWS Lambda, Cloudflare Workers, etc.)

## Cost Considerations

The workshop creator pays for the AI model usage (API calls to Claude, OpenAI, etc.) and the hosting infrastructure. The platform does not cover these costs.

A workshop creator can offset costs by offering coaching as a paid add-on to their workshop. The pricing model is entirely up to the creator.

## Agent Requirements

An AI coaching agent must:

1. **Accept the platform's API contract** — receive JSON payloads with a `type` field and return the expected response format per request type
2. **Ingest full workshop content on initialization** — lessons, sections, examples, answer keys, labels, vocabulary, objectives
3. **Handle at least assessment feedback** — this is the minimum viable capability
4. **Return generated lessons in platform-compatible structure** — so the platform can render them natively (if the agent supports lesson generation)
5. **Be stateless or manage its own state** — the platform does not store agent-side session data
6. **Respect the learner's language** — respond in the interface language, use workshop language for examples

## Open Questions

- What is the minimal viable standard agent? (Feedback-only? Or feedback + lesson generation?)
- Should the standard agent be part of the openlearnapp GitHub org?
- How should the agent handle rate limiting and abuse prevention?
- Should there be a registry of available coaching agents that workshop creators can choose from?
- **Could the platform offer a single centralized coaching agent that works across all workshops?** This would mean workshop creators don't need to provide anything — the platform's own agent ingests any workshop's content and coaches learners automatically. This could be a platform-level feature (free or paid) rather than a per-creator responsibility. Trade-offs: simpler for creators, but the platform bears the AI costs and loses creator-specific customization.
