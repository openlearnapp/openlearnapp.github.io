#!/usr/bin/env bash

# Generate audio files for YAML lessons
# Uses yq for YAML parsing, macOS 'say' for TTS, and ffmpeg for MP3 conversion
#
# New folder-based structure:
#   lessons/{learning}/{teaching}/{lesson-folder}/content.yaml
#   lessons/{learning}/{teaching}/{lesson-folder}/audio/ (output)
#
# Usage:
#   ./generate-audio.sh                           # Generate all built-in lessons
#   ./generate-audio.sh -f                        # Force regenerate all
#   ./generate-audio.sh path/to/lesson-folder/    # Generate single lesson
#   ./generate-audio.sh -f path/to/lesson-folder/ # Force single lesson
#
# Works with external workshops too — auto-detects the content root
# by walking up to find index.yaml:
#   ./generate-audio.sh /path/to/workshop/deutsch/topic/01-lesson/

LESSONS_DIR="public/lessons"
FORCE_REGENERATE=false
SINGLE_LESSON=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--force)
      FORCE_REGENERATE=true
      shift
      ;;
    *)
      SINGLE_LESSON="$1"
      shift
      ;;
  esac
done

# Voice mapping by language code
declare -A VOICES
VOICES["de-DE"]="Anna"        # German
VOICES["de"]="Anna"
VOICES["pt-PT"]="Joana"       # Portuguese (Portugal)
VOICES["pt"]="Joana"
VOICES["en-US"]="Samantha"    # English
VOICES["en"]="Samantha"
VOICES["es-ES"]="Mónica"      # Spanish
VOICES["es"]="Mónica"

echo "🎵 Generating audio files for lessons..."
if [[ "$FORCE_REGENERATE" == true ]]; then
  echo "   🔄 Force mode: regenerating existing files"
fi
echo ""

# Check dependencies
if ! command -v yq &> /dev/null; then
  echo "❌ Error: yq is not installed"
  echo "   Install with: brew install yq"
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "⚠️  Warning: ffmpeg not found. Audio will be saved as AIFF instead of MP3"
  echo "   Install with: brew install ffmpeg"
  HAS_FFMPEG=false
else
  HAS_FFMPEG=true
fi

# Function to get language code from YAML file
get_language_code() {
  local yaml_file="$1"
  local folder_name="$2"

  if [[ ! -f "$yaml_file" ]]; then
    echo ""
    return
  fi

  # Try to find the code for this folder
  local code=$(yq eval ".languages[] | select(.folder == \"$folder_name\") | .code" "$yaml_file" 2>/dev/null)
  if [[ -z "$code" || "$code" == "null" ]]; then
    code=$(yq eval ".workshops[] | select(.folder == \"$folder_name\") | .code" "$yaml_file" 2>/dev/null)
  fi
  if [[ -z "$code" || "$code" == "null" ]]; then
    code=$(yq eval ".topics[] | select(.folder == \"$folder_name\") | .code" "$yaml_file" 2>/dev/null)
  fi

  echo "$code"
}

# Function to get voice for a language
get_voice() {
  local folder_name="$1"
  local parent_dir="$2"
  local content_root="${3:-$LESSONS_DIR}"

  # Try to get code from parent's workshops.yaml, topics.yaml, or index.yaml
  local code=""
  if [[ -z "$code" || "$code" == "null" ]] && [[ -f "$parent_dir/workshops.yaml" ]]; then
    code=$(get_language_code "$parent_dir/workshops.yaml" "$folder_name")
  fi
  if [[ -z "$code" || "$code" == "null" ]] && [[ -f "$parent_dir/topics.yaml" ]]; then
    code=$(get_language_code "$parent_dir/topics.yaml" "$folder_name")
  fi
  if [[ -z "$code" || "$code" == "null" ]] && [[ -f "$parent_dir/index.yaml" ]]; then
    code=$(get_language_code "$parent_dir/index.yaml" "$folder_name")
  fi

  # Try main index.yaml
  if [[ -z "$code" || "$code" == "null" ]]; then
    code=$(get_language_code "$content_root/index.yaml" "$folder_name")
  fi

  # Look up voice by code
  if [[ -n "$code" && "$code" != "null" ]]; then
    local voice="${VOICES[$code]}"
    if [[ -n "$voice" ]]; then
      echo "$voice"
      return
    fi
  fi

  # Fallback: try folder name directly (legacy support)
  local voice="${VOICES[$folder_name]}"
  if [[ -n "$voice" ]]; then
    echo "$voice"
    return
  fi

  # Default fallback
  echo "Alex"
}

# Function to find the content root by walking up to find index.yaml
find_content_root() {
  local dir="$1"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/index.yaml" ]]; then
      echo "$dir"
      return
    fi
    dir=$(dirname "$dir")
  done
  echo ""
}

# Function to process a single lesson folder
process_lesson() {
  local lesson_folder="$1"
  local lesson_file="$lesson_folder/content.yaml"

  # Check if content.yaml exists
  if [[ ! -f "$lesson_file" ]]; then
    echo "⚠️  Warning: No content.yaml found in $lesson_folder"
    return
  fi

  # Resolve absolute path for reliable path extraction
  local abs_folder=$(cd "$lesson_folder" && pwd)

  # Auto-detect content root if lesson is outside LESSONS_DIR
  local abs_lessons_dir="$(cd "$LESSONS_DIR" 2>/dev/null && pwd)"
  local effective_root="$abs_lessons_dir"
  if [[ -z "$abs_lessons_dir" ]] || [[ ! "$abs_folder" == "$abs_lessons_dir"* ]]; then
    local detected_root=$(find_content_root "$abs_folder")
    if [[ -n "$detected_root" ]]; then
      effective_root="$detected_root"
    fi
  fi

  # Extract path components
  local rel_path="${abs_folder#$effective_root/}"
  local learning=$(echo "$rel_path" | cut -d'/' -f1)
  local teaching=$(echo "$rel_path" | cut -d'/' -f2)
  local folder_name=$(basename "$abs_folder")

  echo "📚 Processing: $learning/$teaching/$folder_name"

  # Output directory is inside the lesson folder
  local audio_dir="$lesson_folder/audio"
  mkdir -p "$audio_dir"

  # Get voices for this lesson
  local teaching_voice=$(get_voice "$teaching" "$effective_root/$learning" "$effective_root")
  local learning_voice=$(get_voice "$learning" "$effective_root" "$effective_root")

  if [[ "$teaching_voice" == "Alex" ]]; then
    echo "   ⚠️  No voice found for '$teaching', using default"
  fi

  if [[ "$learning_voice" == "Alex" ]]; then
    echo "   ⚠️  No voice found for '$learning', using default"
  fi

  local files_generated=0
  local files_skipped=0

  # Extract and generate title audio (in base/learning language)
  local title=$(yq eval '.title' "$lesson_file")
  if [[ "$title" != "null" && -n "$title" ]]; then
    local final_file="$audio_dir/title.mp3"

    if [[ "$FORCE_REGENERATE" == true ]] || [[ ! -f "$final_file" ]]; then
      echo "   🎙️  Title: $title"

      local temp_file="$audio_dir/title.aiff"

      say -v "$learning_voice" "$title" -o "$temp_file" 2>/dev/null

      if [[ "$HAS_FFMPEG" == true ]]; then
        ffmpeg -i "$temp_file" -codec:a libmp3lame -qscale:a 2 "$final_file" -y 2>/dev/null
        rm "$temp_file"
      else
        mv "$temp_file" "${temp_file%.aiff}.aiff"
      fi
      ((files_generated++))
    else
      ((files_skipped++))
    fi
  fi

  # Process sections and examples
  local section_count=$(yq eval '.sections | length' "$lesson_file")

  for ((s=0; s<section_count; s++)); do
    # Generate section title audio (in topic/teaching language)
    local section_title=$(yq eval ".sections[$s].title" "$lesson_file")
    if [[ "$section_title" != "null" && -n "$section_title" ]]; then
      local final_section="$audio_dir/$s-title.mp3"

      if [[ "$FORCE_REGENERATE" == true ]] || [[ ! -f "$final_section" ]]; then
        local temp_section="$audio_dir/$s-title.aiff"
        say -v "$teaching_voice" "$section_title" -o "$temp_section" 2>/dev/null

        if [[ "$HAS_FFMPEG" == true ]]; then
          ffmpeg -i "$temp_section" -codec:a libmp3lame -qscale:a 2 "$final_section" -y 2>/dev/null
          rm "$temp_section"
        fi
        ((files_generated++))
      else
        ((files_skipped++))
      fi
    fi

    local example_count=$(yq eval ".sections[$s].examples | length" "$lesson_file")

    for ((e=0; e<example_count; e++)); do
      # Get question and answer
      local question=$(yq eval ".sections[$s].examples[$e].q" "$lesson_file")
      local answer=$(yq eval ".sections[$s].examples[$e].a" "$lesson_file")

      if [[ "$question" != "null" && -n "$question" ]]; then
        # Generate question audio (in teaching language)
        local final_q="$audio_dir/$s-$e-q.mp3"

        if [[ "$FORCE_REGENERATE" == true ]] || [[ ! -f "$final_q" ]]; then
          local temp_q="$audio_dir/$s-$e-q.aiff"
          say -v "$teaching_voice" "$question" -o "$temp_q" 2>/dev/null

          if [[ "$HAS_FFMPEG" == true ]]; then
            ffmpeg -i "$temp_q" -codec:a libmp3lame -qscale:a 2 "$final_q" -y 2>/dev/null
            rm "$temp_q"
          fi
          ((files_generated++))
        else
          ((files_skipped++))
        fi
      fi

      # Generate assessment option audio (select/multiple-choice)
      local option_count=$(yq eval ".sections[$s].examples[$e].options | length" "$lesson_file" 2>/dev/null)
      if [[ "$option_count" != "null" && "$option_count" -gt 0 ]] 2>/dev/null; then
        for ((o=0; o<option_count; o++)); do
          local option_text=$(yq eval ".sections[$s].examples[$e].options[$o].text" "$lesson_file")
          if [[ "$option_text" != "null" && -n "$option_text" ]]; then
            local final_opt="$audio_dir/$s-$e-opt$o.mp3"

            if [[ "$FORCE_REGENERATE" == true ]] || [[ ! -f "$final_opt" ]]; then
              local temp_opt="$audio_dir/$s-$e-opt$o.aiff"
              say -v "$teaching_voice" "$option_text" -o "$temp_opt" 2>/dev/null

              if [[ "$HAS_FFMPEG" == true ]]; then
                ffmpeg -i "$temp_opt" -codec:a libmp3lame -qscale:a 2 "$final_opt" -y 2>/dev/null
                rm "$temp_opt"
              fi
              ((files_generated++))
            else
              ((files_skipped++))
            fi
          fi
        done
      fi

      if [[ "$answer" != "null" && -n "$answer" ]]; then
        # Generate answer audio (in learning language)
        local final_a="$audio_dir/$s-$e-a.mp3"

        if [[ "$FORCE_REGENERATE" == true ]] || [[ ! -f "$final_a" ]]; then
          local temp_a="$audio_dir/$s-$e-a.aiff"
          say -v "$learning_voice" "$answer" -o "$temp_a" 2>/dev/null

          if [[ "$HAS_FFMPEG" == true ]]; then
            ffmpeg -i "$temp_a" -codec:a libmp3lame -qscale:a 2 "$final_a" -y 2>/dev/null
            rm "$temp_a"
          fi
          ((files_generated++))
        else
          ((files_skipped++))
        fi
      fi
    done
  done

  # Generate manifest.yaml listing all audio files
  local manifest_file="$audio_dir/manifest.yaml"
  echo "files:" > "$manifest_file"
  for mp3 in "$audio_dir"/*.mp3; do
    if [[ -f "$mp3" ]]; then
      echo "  - $(basename "$mp3")" >> "$manifest_file"
    fi
  done
  echo "   📋 Written $manifest_file"

  # Report results
  if [[ $files_skipped -gt 0 ]]; then
    echo "   ✅ Generated $files_generated, skipped $files_skipped existing files"
  else
    echo "   ✅ Generated $files_generated audio files"
  fi
  echo ""
}

# Main execution
if [[ -n "$SINGLE_LESSON" ]]; then
  # Process single lesson folder
  # Remove trailing slash if present
  SINGLE_LESSON="${SINGLE_LESSON%/}"

  if [[ ! -d "$SINGLE_LESSON" ]]; then
    echo "❌ Error: Directory not found: $SINGLE_LESSON"
    exit 1
  fi

  if [[ ! -f "$SINGLE_LESSON/content.yaml" ]]; then
    echo "❌ Error: No content.yaml found in $SINGLE_LESSON"
    echo "   This should be a lesson folder containing content.yaml"
    exit 1
  fi

  process_lesson "$SINGLE_LESSON"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Complete!"
  echo "   Audio files saved in: $SINGLE_LESSON/audio/"
else
  # Process all lessons (find all content.yaml files)
  total_files=0
  processed_files=0

  while IFS= read -r -d '' content_file; do
    # Get the lesson folder (parent directory of content.yaml)
    lesson_folder=$(dirname "$content_file")

    ((total_files++))
    process_lesson "$lesson_folder"
    ((processed_files++))
  done < <(find "$LESSONS_DIR" -name "content.yaml" -type f -print0)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Complete!"
  echo "   Processed $processed_files lessons"
  echo ""

  # Show example directory structure
  if command -v tree &> /dev/null; then
    echo "Example directory structure:"
    # Find first lesson folder and show its structure
    first_lesson=$(find "$LESSONS_DIR" -name "content.yaml" -type f | head -1 | xargs dirname)
    if [[ -n "$first_lesson" ]]; then
      tree -L 1 "$first_lesson"
    fi
  else
    echo "Example audio files:"
    first_audio=$(find "$LESSONS_DIR" -path "*/audio/*.mp3" -type f | head -5)
    if [[ -n "$first_audio" ]]; then
      echo "$first_audio"
    fi
  fi
fi
