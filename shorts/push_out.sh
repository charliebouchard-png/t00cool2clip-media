#!/bin/bash
# bash shorts/push_out.sh <name> -> pushes /tmp/shorts/<name>/final_*.mp4 to branch shorts-<name> (shorts/out/<name>/)
set -e; NAME=$1; R=/home/claude/t00cool2clip-media; T=$(mktemp -d); cd $T; git init -q; git remote add origin "$(git -C $R remote get-url origin)"
mkdir -p shorts/out/$NAME; cp /tmp/shorts/$NAME/final_*.mp4 shorts/out/$NAME/; git add shorts; git -c user.name=claude -c user.email=claude@users.noreply.github.com commit -qm "shorts $NAME"; git push -q -f origin HEAD:shorts-$NAME; rm -rf $T; echo pushed shorts-$NAME
