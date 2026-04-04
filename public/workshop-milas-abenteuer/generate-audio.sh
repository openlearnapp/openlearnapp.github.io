#!/usr/bin/env bash
set -e

WORKSHOP_DIR="$1"
if [[ -z "$WORKSHOP_DIR" ]]; then
  echo "Usage: $0 <workshop-dir>"
  exit 1
fi

# Voice mapping: role → edge-tts voice
declare -A VOICES
VOICES["narrator"]="de-DE-KillianNeural"
VOICES["grandma"]="de-DE-KatjaNeural"
VOICES["fridolin"]="de-DE-ConradNeural"
VOICES["default"]="de-DE-AmalaNeural"

generate() {
  local text="$1" voice="$2" output="$3"
  if [[ -z "$text" || "$text" == "null" ]]; then return; fi
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
    # Section title
    section_title=$(yq eval ".sections[$s].title" "$lesson_dir/content.yaml")
    if [[ "$section_title" != "null" && -n "$section_title" ]]; then
      generate "$section_title" "${VOICES[default]}" "$audio_dir/$s-title.mp3"
      total=$((total + 1))
    fi
    
    # Examples
    example_count=$(yq eval ".sections[$s].examples | length" "$lesson_dir/content.yaml")
    for ((e=0; e<example_count; e++)); do
      # Question
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
      
      # Assessment options
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
  
  # Write manifest
  echo "files:" > "$audio_dir/manifest.yaml"
  for mp3 in "$audio_dir"/*.mp3; do
    [[ -f "$mp3" ]] && echo "  - $(basename "$mp3")" >> "$audio_dir/manifest.yaml"
  done
  echo "   📋 manifest.yaml"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Generated $total audio files"
