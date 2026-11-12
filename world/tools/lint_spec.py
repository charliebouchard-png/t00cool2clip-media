#!/usr/bin/env python3
# python world/tools/lint_spec.py world/specs/<ID>.json  -> checks a script against the PLAYBOOK rules. Fix every FAIL before rendering.
import json, re, sys
s = json.load(open(sys.argv[1])); sc = s['scenes']; say = [x['say'] for x in sc]; allw = ' '.join(say)
def syl(w):
    w = re.sub(r'[^a-z]', '', w.lower()); 
    if not w: return 0
    v = re.findall(r'[aeiouy]+', w); n = len(v) - (1 if w.endswith('e') and len(v) > 1 else 0); return max(1, n)
words = re.findall(r"[A-Za-z']+", allw); sents = max(1, len(re.findall(r'[.!?]+', allw)))
grade = .39 * len(words) / sents + 11.8 * sum(syl(w) for w in words) / max(1, len(words)) - 15.59
wps = 3.3  # engine speech rate at cast speed ~1.18
est = len(words) / wps + .12 * len(sc)
res = []
def chk(ok, msg): res.append(('PASS' if ok else 'FAIL') + '  ' + msg)
first = say[0]; first_sent = re.split(r'(?<=[.!?])\s', first)[0]
chk(len(first_sent.split()) <= 12, f'hook sentence ≤12 words ({len(first_sent.split())}): "{first_sent}"')
chk(bool(s.get('hook')) and len(s['hook'].replace('\n', ' ').split()) <= 7, f'hook card present, ≤7 words: {s.get("hook")!r}')
chk(not re.search(r"\b(hey guys|hi guys|welcome back|let'?s get started|in this video)\b", allw, re.I), 'no intro fluff ("hey guys", "let\'s get started", "in this video")')
chk(not re.search(r'follow for more\W*$', say[-1], re.I) and not any(x.get('end') for x in sc), 'no "follow for more" outro / end card (ending must loop)')
chk(bool(re.search(r'\b(you|your)\b', ' '.join(say[:2]), re.I)), 'talks to the viewer ("you/your") in the first two scenes')
chk(sum(len(re.findall(r'\b(but|so|therefore|until|then)\b', x, re.I)) for x in say) >= len(sc), 'but/so/therefore chain (≥1 per scene on average)')
chk(any(x.get('poll') for x in sc), 'one poll (comment bait)')
chk(all(len(x.get('gestures', [])) >= 3 for x in sc[:-1]), '3 gestures (camera moves) per scene except the last')
chk(grade <= 6.5, f'reading grade ≤6.5 (now {grade:.1f}) — shorter words/sentences')
tgt = s.get('target', 'tiktok')
lo, hi = (32, 48) if tgt == 'tiktok' else (55, 66)
chk(lo <= est <= hi, f'estimated length {est:.0f}s within {lo}-{hi}s for target "{tgt}" ({len(words)} words)')
chk(bool(s.get('cast')), f'presenter set: {s.get("cast")}')
chk(bool(s.get('style')), 'style options set')
chk(not re.search(r'\b(you should (buy|invest|sell)|guaranteed|get rich)\b', allw, re.I), 'no financial advice / get-rich promises')
print('\n'.join(res)); print(f'-> {sum(r.startswith("FAIL") for r in res)} FAIL')
sys.exit(1 if any(r.startswith('FAIL') for r in res) else 0)
