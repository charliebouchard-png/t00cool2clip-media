#!/bin/bash
# bash clipdesk/dispatch.sh <workflow.yml> key=value ...   (REST API; `gh workflow run` needs GraphQL, which is blocked here)
WF=$1; shift; ARGS=(); for kv in "$@"; do ARGS+=(-f "inputs[${kv%%=*}]=${kv#*=}"); done
gh api -X POST repos/charliebouchard-png/t00cool2clip-media/actions/workflows/$WF/dispatches -f ref=main "${ARGS[@]}"
