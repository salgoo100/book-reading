// OpenAI TTS로 이야기 음성(MP3)을 미리 만들어 audio/ 에 저장한다.
// 사용법 (PowerShell):
//   $env:OPENAI_API_KEY = "sk-..."      # 키는 이 창에서만 유효, 파일에 저장하지 않음
//   node tools/make_audio.mjs --dry      # 만들 목록과 글자 수만 확인 (API 호출 없음)
//   node tools/make_audio.mjs lion       # 사자와 쥐만 생성
//   node tools/make_audio.mjs            # 전체 생성 (이미 만든 건 건너뜀)
//   node tools/make_audio.mjs lion --force   # 다시 생성
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "audio");
const MODEL = "gpt-4o-mini-tts";
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
const ONLY = args.filter(a => !a.startsWith("--"));

// index.html 안의 STORIES, KID를 그대로 읽어 온다 (데이터를 한 곳에서만 관리)
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const KID = html.match(/const KID = "([^"]+)"/)[1];
const KID_SAY = html.match(/const KID_SAY = "([^"]+)"/)[1];
const storiesSrc = html.slice(html.indexOf("const STORIES = ["), html.indexOf("\n];", html.indexOf("const STORIES = [")) + 3);
const STORIES = new Function("KID", storiesSrc.replace("const STORIES =", "return"))(KID);

// 배역별 OpenAI 목소리와 연기 지시
const BASE = "This is for a 6-year-old Korean child learning English. Speak clearly, a little slowly, with warm, lively picture-book storytelling energy.";
const CAST = {
  narrator:   ["coral",   "You are a warm, gentle storyteller reading a bedtime picture book. Expressive but calm; pause naturally."],
  lion:       ["onyx",    "You are a big lion: deep, rumbly, grand voice. Dramatic and a little grumpy, but never truly scary for small kids."],
  wolf:       ["ash",     "You are a sly, silly cartoon wolf: growly and theatrical, more funny than scary."],
  villager:   ["echo",    "You are a tired, grumbling village farmer."],
  tortoise:   ["ballad",  "You are a calm, wise, very slow tortoise. Speak slowly and kindly."],
  hare:       ["verse",   "You are a cocky, bouncy, show-off hare. Fast, bragging, full of yourself."],
  grasshopper:["fable",   "You are a carefree, musical grasshopper. Playful and sing-song; when cold or sorry, sound humble."],
  prince:     ["echo",    "You are a kind, friendly young prince."],
  mouse:      ["shimmer", "You are a tiny, brave little mouse: high, small, squeaky but sweet voice."],
  boy:        ["alloy",   "You are a mischievous young shepherd boy around nine years old."],
  pig:        ["nova",    "You are a cheerful little pig: bright, bouncy, childlike."],
  ant:        ["sage",    "You are a busy, kind, sensible little ant."],
  fairy:      ["shimmer", "You are a magical, twinkly, kind fairy godmother. Full of wonder."],
  cinderella: ["nova",    "You are Cinderella: gentle, kind, hopeful young woman."],
  stepsister: ["sage",    "You are a snooty, silly stepsister."],
};
const roleOf = who => Object.keys(CAST).find(k => who.toLowerCase().includes(k)) || "narrator";
// index.html의 sceneParts와 같은 규칙: 따옴표 대사는 who 순서대로 배역
function sceneParts(sc) {
  const who = (sc.who || "").split(",").filter(Boolean); let q = 0; const out = [];
  for (const m of sc.text.matchAll(/"[^"]*"|[^"]+/g)) {
    if (!m[0].trim()) continue;
    out.push({ text: m[0].trim(), role: m[0].startsWith('"') ? (who[q++] || "narrator") : "narrator" });
  }
  return out;
}

// 만들 클립 목록. key는 index.html이 찾는 이름과 같아야 한다
const jobs = [];
const add = (key, text, role, context) => jobs.push({ key, text, role, context });
add("common/great", `Great job, ${KID}!`, "narrator", "Praise the child warmly and excitedly.");
for (const s of STORIES) {
  if (ONLY.length && !ONLY.includes(s.id)) continue;
  s.scenes.forEach((sc, i) => {
    const K = `${s.id}/s${i + 1}`;
    sceneParts(sc).forEach((p, j) => add(`${K}-p${j + 1}`, p.text, p.role, `Story: ${s.title}. Full line of this page: ${sc.text}`));
    if (sc.why) add(`${K}-why`, sc.why.text, roleOf(sc.why.who), `Story: ${s.title}. The character explains to the child why they did this.`);
    if (sc.ask) add(`${K}-ask`, sc.ask.q, "narrator", "Ask the child this question in a curious, inviting way, then leave room for an answer.");
    if (sc.quiz) {
      add(`${K}-quiz`, sc.quiz.q, "narrator", "Ask this quiz question playfully.");
      sc.quiz.opts.forEach((o, k) => add(`${K}-quiz${k}`, o[2] ? `Yes! ${o[1]}! Good job!` : `Hmm, not ${o[1]}. Try again!`, "narrator",
        o[2] ? "Celebrate the right answer happily." : "Gently and encouragingly say it's not right, try again."));
    }
  });
  add(`${s.id}/end`, `The end! ${s.moral} Great reading, ${KID}!`, "narrator", "Finish the story proudly and happily.");
  add(`${s.id}/moral`, s.moral, "narrator", "Say the lesson of the story clearly so the child can repeat it.");
}

const manifestPath = path.join(OUT, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const hashOf = j => crypto.createHash("sha1").update([MODEL, ...CAST[j.role], j.text, j.context].join("|")).digest("hex").slice(0, 10);
const todo = jobs.filter(j => FORCE || manifest[j.key]?.h !== hashOf(j));
const chars = todo.reduce((n, j) => n + j.text.length, 0);
console.log(`클립 ${jobs.length}개 중 새로 만들 것 ${todo.length}개, 약 ${chars}자`);
if (DRY) { todo.forEach(j => console.log(`  ${j.key.padEnd(22)} [${j.role}] ${j.text}`)); process.exit(0); }
if (!process.env.OPENAI_API_KEY) { console.error("OPENAI_API_KEY 환경 변수가 없습니다."); process.exit(1); }

let done = 0, failed = 0;
for (const j of todo) {
  const [voice, persona] = CAST[j.role];
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice, input: j.text.replaceAll(KID, KID_SAY), response_format: "mp3",
      instructions: `${BASE}\n${persona}\n${j.context}` }),
  });
  if (!res.ok) {
    failed++; console.error(`✗ ${j.key}: ${res.status} ${(await res.text()).slice(0, 300)}`);
    if (res.status === 401 || res.status === 429) break;  // 키 문제나 한도 초과면 바로 중단
    continue;
  }
  const file = `${j.key}.mp3`;
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
  manifest[j.key] = { f: file, h: hashOf(j) };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));  // 중간에 멈춰도 진행분 보존
  console.log(`✓ ${++done}/${todo.length} ${j.key}  [${voice}] ${j.text}`);
}
console.log(`완료 ${done}개, 실패 ${failed}개`);
