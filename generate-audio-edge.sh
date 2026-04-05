#!/usr/bin/env bash
#
# Generate audio files for YAML lessons using Microsoft Edge TTS
# (Neural voices — much better quality than macOS 'say')
#
# Dependencies:
#   - uv (https://github.com/astral-sh/uv) for running edge-tts
#   - yq (brew install yq) for YAML parsing
#
# Usage:
#   ./generate-audio-edge.sh <lesson-folder>
#   ./generate-audio-edge.sh path/to/workshop/deutsch/my-topic
#
# Voice mapping:
#   Each lesson folder can have a voices.yaml with role → voice mapping:
#     narrator: de-DE-KillianNeural
#     default: de-DE-AmalaNeural
#
#   Or set via environment variables:
#     VOICE_DEFAULT=de-DE-KatjaNeural ./generate-audio-edge.sh ...
#
# Examples in content.yaml can reference a role via `voice:` field:
#   - q: "Es war einmal..."
#     voice: narrator
#
# List available voices:
#   uvx edge-tts --list-voices | grep "de-DE"

set -e

WORKSHOP_DIR="$1"
if [[ -z "$WORKSHOP_DIR" ]]; then
  echo "Usage: $0 <workshop-dir>"
  echo ""
  echo "Example: $0 deutsch/my-topic"
  echo ""
  echo "List voices: uvx edge-tts --list-voices | grep de-DE"
  exit 1
fi

if ! command -v uvx &> /dev/null; then
  echo "❌ uvx not found. Install uv: https://github.com/astral-sh/uv"
  exit 1
fi

if ! command -v yq &> /dev/null; then
  echo "❌ yq not found. Install: brew install yq"
  exit 1
fi

# Default voice mapping (override via voices.yaml in workshop dir or env vars)
declare -A VOICES
VOICES["default"]="${VOICE_DEFAULT:-de-DE-AmalaNeural}"
VOICES["narrator"]="${VOICE_NARRATOR:-de-DE-KillianNeural}"
VOICES["male"]="${VOICE_MALE:-de-DE-ConradNeural}"
VOICES["female"]="${VOICE_FEMALE:-de-DE-KatjaNeural}"

# Load voices.yaml from workshop dir if present (overrides defaults)
VOICES_FILE="$WORKSHOP_DIR/voices.yaml"
if [[ -f "$VOICES_FILE" ]]; then
  echo "📋 Loading voice mapping from $VOICES_FILE"
  while IFS=': ' read -r role voice; do
    role=$(echo "$role" | xargs)
    voice=$(echo "$voice" | xargs)
    [[ -n "$role" && -n "$voice" && "$role" != "#"* ]] && VOICES["$role"]="$voice"
  done < "$VOICES_FILE"
fi

echo "🎵 Voice mapping:"
for role in "${!VOICES[@]}"; do
  echo "   $role → ${VOICES[$role]}"
done
echo ""

generate() {
  local text="$1" voice="$2" output="$3"
  [[ -z "$text" || "$text" == "null" ]] && return
  mkdir -p "$(dirname "$output")"
  uvx edge-tts --text "$text" --voice "$voice" --write-media "$output" 2>/dev/null
  echo "   ✅ $(basename "$output") ($voice)"
}

get_voice() {
  local role="$1"
  local v="${VOICES[$role]}"
  echo "${v:-${VOICES[default]}}"
}

total=0

for lesson_dir in "$WORKSHOP_DIR"/*/; do
  [[ -f "$lesson_dir/content.yaml" ]] || continue

  lesson_name=$(basename "$lesson_dir")
  audio_dir="$lesson_dir/audio"
  mkdir -p "$audio_dir"

  echo "📚 $lesson_name"

  # Lesson title
  title=$(yq eval '.title' "$lesson_dir/content.yaml")
  if [[ "$title" != "null" && -n "$title" ]]; then
    generate "$title" "${VOICES[default]}" "$audio_dir/title.mp3"
    total=$((total + 1))
  fi

  # Sections
  section_count=$(yq eval '.sections | length' "$lesson_dir/content.yaml")
  for ((s=0; s<section_count; s++)); do
    section_title=$(yq eval ".sections[$s].title" "$lesson_dir/content.yaml")
    if [[ "$section_title" != "null" && -n "$section_title" ]]; then
      generate "$section_title" "${VOICES[default]}" "$audio_dir/$s-title.mp3"
      total=$((total + 1))
    fi

    example_count=$(yq eval ".sections[$s].examples | length" "$lesson_dir/content.yaml")
    for ((e=0; e<example_count; e++)); do
      # Question — use voice role if set, else default
      q=$(yq eval ".sections[$s].examples[$e].q" "$lesson_dir/content.yaml")
      voice_role=$(yq eval ".sections[$s].examples[$e].voice // \"default\"" "$lesson_dir/content.yaml")
      voice=$(get_voice "$voice_role")

      if [[ "$q" != "null" && -n "$q" ]]; then
        generate "$q" "$voice" "$audio_dir/$s-$e-q.mp3"
        total=$((total + 1))
      fi

      # Answer
      a=$(yq eval ".sections[$s].examples[$e].a" "$lesson_dir/content.yaml")
      if [[ "$a" != "null" && -n "$a" ]]; then
        generate "$a" "${VOICES[default]}" "$audio_dir/$s-$e-a.mp3"
        total=$((total + 1))
      fi

      # Assessment options (select/multiple-choice)
      opt_count=$(yq eval ".sections[$s].examples[$e].options | length" "$lesson_dir/content.yaml" 2>/dev/null)
      if [[ "$opt_count" != "null" && "$opt_count" -gt 0 ]] 2>/dev/null; then
        for ((o=0; o<opt_count; o++)); do
          opt_text=$(yq eval ".sections[$s].examples[$e].options[$o].text" "$lesson_dir/content.yaml")
          if [[ "$opt_text" != "null" && -n "$opt_text" ]]; then
            generate "$opt_text" "${VOICES[default]}" "$audio_dir/$s-$e-opt$o.mp3"
            total=$((total + 1))
          fi
        done
      fi
    done
  done

  # Write manifest.yaml
  echo "files:" > "$audio_dir/manifest.yaml"
  for mp3 in "$audio_dir"/*.mp3; do
    [[ -f "$mp3" ]] && echo "  - $(basename "$mp3")" >> "$audio_dir/manifest.yaml"
  done
  echo "   📋 manifest.yaml"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Generated $total audio files"
