# Export & Import

## Purpose

Let learners back up, transfer, and restore their learning progress and assessment answers — per workshop — without relying on any server or account system.

## What Gets Exported

An export captures all user-generated data for a single workshop:

- **Learning item progress**: Which vocabulary or concepts the learner has marked as learned.
- **Assessment answers**: All submitted answers across every lesson in the workshop, including what was answered, whether it was correct, and when it was submitted.

Settings and content source configuration are not included in exports.

## Per-Workshop Scope

Exports are scoped to a single workshop. The learner selects which workshop to export from the Settings page. This keeps export files focused and manageable — a learner working through five workshops can export each one independently.

## Export Format

The export produces a JSON file downloaded to the learner's device. The file follows the naming convention `open-learn-{workshop}-{date}.json`, making it easy to identify which workshop and when the export was created.

## Import Behavior

Importing a file merges the data additively with any existing progress:

- Items already marked as learned remain learned.
- New learned items from the import are added.
- Assessment answers from the import are merged in. Existing answers are not overwritten or deleted.

This additive approach ensures that importing can never cause data loss. A learner can safely import an older backup without losing recent progress.

## Access Point

Export and import controls are available on the Settings page. The workflow is:

1. Navigate to Settings.
2. Select a workshop from the export dropdown.
3. Click export to download the JSON file.
4. To import, select a previously exported JSON file — the data is merged immediately.

## Use Cases

- **Device transfer**: Export on one device, import on another.
- **Backup**: Periodically save progress as a local file.
- **Sharing**: A teacher exports a completed workshop and shares the file as a reference.
- **Recovery**: Restore progress after clearing browser data.
