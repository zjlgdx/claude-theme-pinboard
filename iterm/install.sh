#!/bin/sh
# Adds two iTerm2 profiles, "Pinboard Night" and "Pinboard Day": Pinboard's
# colors with a faded cork board behind the text. They inherit your "Default"
# profile (font, size, keys) and change nothing else. Remove them by deleting
# the two paths printed at the end.
set -e
here=$(cd "$(dirname "$0")" && pwd)
support="$HOME/Library/Application Support/iTerm2"
images="$support/Pinboard"
mkdir -p "$images" "$support/DynamicProfiles"
cp "$here/pinboard-night-background.jpg" "$here/pinboard-day-background.jpg" "$images/"
# The template names the pictures by a placeholder; point it at their new home.
python3 - "$here/pinboard-profiles.template.json" "$images" "$support/DynamicProfiles/pinboard.json" <<'EOF'
import json, sys
template, images, out = sys.argv[1:]
text = open(template).read().replace('__IMAGES__', images)
json.loads(text)
open(out, 'w').write(text)
EOF
echo "Added: $support/DynamicProfiles/pinboard.json"
echo "Added: $images"
echo "In iTerm2: Profiles > Pinboard Night (or Pinboard Day)."
