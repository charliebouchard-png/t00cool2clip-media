"""Builds the idea bank: one JSON + one Markdown page per idea, plus index.json.
Run from explainer/ideas:  python3 build.py"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data_a import BUSINESS, CONS
from data_b import COLLAPSES, HISTORY
from data_c import SYSTEMS, LIVING, MINDS

REPO = "charliebouchard-png/t00cool2clip-media"
GH = f"https://github.com/{REPO}/blob/main/explainer/ideas"
RAW = f"https://raw.githubusercontent.com/{REPO}/main/explainer/ideas"

STYLES = {
 "ledger": ("Ledger", "Dark motion graphics: glowing numbers, charts and icons, soft crossfades. Clean and data-led."),
 "documentary": ("Archive documentary", "Film grain, letterbox bars, serif type, newspaper cuttings and maps. The camera pans sideways from one moment to the next instead of cutting."),
 "collage": ("Paper collage", "Cream paper, torn cut-outs, red marker colours and heavy type. Each new scene slaps down like a card on a table."),
 "chalk": ("Blackboard", "A chalkboard in a wooden frame with handwritten text. Scenes change with an eraser wipe, like a teacher explaining on the board."),
 "neon": ("Synthwave neon", "Purple night sky, glowing grid floor and neon type. Scenes change with a quick glitch."),
 "bold": ("Bold minimal", "Off-white page, giant condensed capitals, black and red only. Hard, punchy cuts on the beat."),
 "storybook": ("Cartoon town", "Flat 2D cartoon characters in a colourful painted town with ink outlines and speech bubbles. Daylight while the story is set up, then night-blue lighting for the explanation."),
}
CATS = [
 ("How it makes money", BUSINESS, ["storybook", "bold", "collage"], ["business model", "how it makes money", "business explained"]),
 ("Heists and cons", CONS, ["documentary", "neon"], ["true crime", "heist", "scam", "con artist"]),
 ("Collapses and frauds", COLLAPSES, ["documentary", "collage"], ["corporate fraud", "company collapse", "finance documentary"]),
 ("Money history", HISTORY, ["documentary", "chalk"], ["history of money", "economic history", "financial history"]),
 ("How money works", SYSTEMS, ["chalk", "ledger", "bold"], ["money explained", "economics", "personal finance uk"]),
 ("Cost of living", LIVING, ["collage", "ledger", "bold"], ["cost of living", "uk money", "personal finance uk"]),
 ("Money psychology", MINDS, ["storybook", "neon"], ["money psychology", "consumer psychology", "spending habits"]),
]
FORMULA = {
 "storybook": "Story formula: open on a paradox stated as fact (no intro), set the scene with a named everyday character, escalate in 3 to 5 beats with short dialogue in speech bubbles, then pivot with 'You see,' into the real explanation (lighting turns night-blue) and land on an ironic last line.",
}
DEFAULT_FORMULA = "Script formula: the hook is the first sentence (no intro), then 4 to 6 chapters, each opening with a question the viewer wants answered. Keep sentences short and spoken. Close every chapter with a mini-cliffhanger into the next, and end on a one-line takeaway."

def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]

def main():
    out = []; n = 0
    for cat, items, styles, ctags in CATS:
        for k, (title, hook, outline, verify, thumb, emoji, color) in enumerate(items):
            n += 1; code = f"MV{n:03d}"; style = styles[k % len(styles)]
            words = [w for w in re.findall(r"[A-Za-z0-9£$€']+", title) if len(w) > 3]
            tags = list(dict.fromkeys(ctags + [title.split(':')[0].lower()[:60]] + [w.lower() for w in words[:4]] + ["money explained"]))[:12]
            desc = (f"{hook}\n\nIn this video:\n" + "\n".join(f"- {o}" for o in outline) +
                    "\n\nSources are listed here once the script has been fact-checked.\n"
                    "This video is for education and entertainment only and is not financial advice.\n\n"
                    + " ".join("#" + re.sub(r"[^a-z0-9]", "", t) for t in (["money"] + ctags[:2])))
            paste = f"Make video {code} from my idea bank: write and fact-check the full 5+ minute script, render it in its style, and send it to me."
            lines = thumb.split("|"); longest = max(len(l) for l in lines)
            size = int(min(200, 1150 / (longest * .62), 760 / (len(lines) * 1.1)))
            idea = {"code": code, "title": title, "category": cat, "style": style, "style_name": STYLES[style][0], "style_notes": STYLES[style][1],
                    "script_formula": FORMULA.get(style, DEFAULT_FORMULA), "hook": hook, "outline": outline, "facts_to_verify": verify,
                    "description": desc, "tags": tags, "target_length": "6 to 8 minutes (about 1,000 to 1,300 words)",
                    "thumbnail": {"text": thumb, "emoji": emoji, "color": color, "tag": cat, "size": size, "style": style},
                    "thumbnail_url": f"{RAW}/thumbs/{code}.jpg", "page_url": f"{GH}/{code}.md", "paste_to_claude": paste, "status": "idea"}
            json.dump(idea, open(f"{code}.json", "w"), ensure_ascii=False, indent=1)
            md = (f"# {code} · {title}\n\n![thumbnail](thumbs/{code}.jpg)\n\n"
                  f"## Paste this to Claude\n\n```\n{paste}\n```\n\n"
                  f"**Category:** {cat}  \n**Editing style:** {STYLES[style][0]}. {STYLES[style][1]}  \n**Length:** {idea['target_length']}\n\n"
                  f"## Hook (first line)\n\n> {hook}\n\n## Outline\n\n" + "\n".join(f"{i+1}. {o}" for i, o in enumerate(outline)) +
                  f"\n\n## YouTube title\n\n{title}\n\n## YouTube description\n\n```\n{desc}\n```\n\n## Tags\n\n{', '.join(tags)}\n\n"
                  f"## Facts to check before scripting\n\n" + "\n".join(f"- {v}" for v in verify) + f"\n\n## Script approach\n\n{idea['script_formula']}\n")
            open(f"{code}.md", "w").write(md); out.append(idea)
    json.dump(out, open("index.json", "w"), ensure_ascii=False, indent=1)
    print(n, "ideas;", {s: sum(1 for i in out if i['style'] == s) for s in STYLES})

main()
