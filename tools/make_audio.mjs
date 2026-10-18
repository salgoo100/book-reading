// 이야기 음성을 AI TTS로 미리 만들어 audio/ 에 저장한다. 기본은 Gemini, --openai 로 OpenAI.
// 사용법 (PowerShell):
//   $env:GEMINI_API_KEY = "..."          # 키는 이 창에서만 유효, 파일에 저장하지 않음
//   node tools/make_audio.mjs --dry      # 만들 목록과 글자 수만 확인 (API 호출 없음)
//   node tools/make_audio.mjs lion       # 사자와 쥐만 생성
//   node tools/make_audio.mjs            # 전체 생성 (이미 만든 건 건너뜀)
//   node tools/make_audio.mjs lion --force   # 다시 생성
//   node tools/make_audio.mjs --openai   # OpenAI TTS 사용 ($env:OPENAI_API_KEY 필요)
//   node tools/make_audio.mjs --bounds   # 이미 만든 WAV의 말소리 구간(s/e)만 다시 계산 (API 호출 없음)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "audio");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
const PROVIDER = args.includes("--openai") ? "openai" : "gemini";
const ONLY = args.filter(a => !a.startsWith("--"));
const MODEL = { gemini: "gemini-3.8-flash-tts", openai: "gpt-4o-mini-tts" }[PROVIDER];
const EXT = { gemini: "wav", openai: "mp3" }[PROVIDER];
const KEY_ENV = { gemini: "GEMINI_API_KEY", openai: "OPENAI_API_KEY" }[PROVIDER];

// index.html 안의 STORIES, KID를 그대로 읽어 온다 (데이터를 한 곳에서만 관리)
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const KID = html.match(/const KID = "([^"]+)"/)[1];
const KID_SAY = html.match(/const KID_SAY = "([^"]+)"/)[1];
const storiesSrc = html.slice(html.indexOf("const STORIES = ["), html.indexOf("\n];", html.indexOf("const STORIES = [")) + 3);
const STORIES = new Function("KID", storiesSrc.replace("const STORIES =", "return"))(KID);

// 배역: [Gemini 목소리, OpenAI 목소리, 연기 지시]
const BASE = "For a 6-year-old Korean child learning English: clear and expressive at a natural, brisk storytelling pace (not slow, no long pauses), warm and lively like a picture-book read-aloud.";
const CAST = {
  narrator:   ["Sulafat",     "coral",   "a warm, gentle storyteller reading a bedtime picture book; expressive but calm, natural pauses"],
  lion:       ["Algenib",     "onyx",    "a big lion: deep, rumbly, grand voice; dramatic and a little grumpy, but never truly scary for small kids"],
  wolf:       ["Orus",        "ash",     "a sly, silly cartoon wolf: growly and theatrical, more funny than scary"],
  villager:   ["Gacrux",      "echo",    "a tired, grumbling village farmer"],
  tortoise:   ["Schedar",     "ballad",  "a calm, wise, very slow tortoise; speaking slowly and kindly"],
  hare:       ["Puck",        "verse",   "a cocky, bouncy, show-off hare; fast and bragging, full of himself"],
  grasshopper:["Sadachbia",   "fable",   "a carefree, musical grasshopper; playful and sing-song, humble when cold or sorry"],
  prince:     ["Achird",      "echo",    "a kind, friendly young prince"],
  mouse:      ["Leda",        "shimmer", "a tiny, brave little mouse: high, small, squeaky but sweet voice"],
  boy:        ["Fenrir",      "alloy",   "a mischievous young shepherd boy around nine years old"],
  pig:        ["Laomedeia",   "nova",    "a cheerful little pig: bright, bouncy, childlike"],
  ant:        ["Autonoe",     "sage",    "a busy, kind, sensible little ant"],
  fairy:      ["Zephyr",      "shimmer", "a magical, twinkly, kind fairy godmother, full of wonder"],
  cinderella: ["Despina",     "nova",    "Cinderella: a gentle, kind, hopeful young woman"],
  stepsister: ["Pulcherrima", "sage",    "a snooty, silly stepsister"],
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
    if (sc.ask) add(`${K}-ask`, sc.ask.q, "narrator", "Ask the child this question in a curious, inviting way.");
    if (sc.quiz) {
      add(`${K}-quiz`, sc.quiz.q, "narrator", "Ask this quiz question playfully.");
      sc.quiz.opts.forEach((o, k) => add(`${K}-quiz${k}`, o[2] ? `Yes! ${o[1]}! Good job!` : `Hmm, not ${o[1]}. Try again!`, "narrator",
        o[2] ? "Celebrate the right answer happily." : "Gently and encouragingly say it's not right, try again."));
    }
  });
  add(`${s.id}/end`, `The end! ${s.moral} Great reading, ${KID}!`, "narrator", "Finish the story proudly and happily.");
  add(`${s.id}/moral`, s.moral, "narrator", "Say the lesson of the story clearly so the child can repeat it.");
}

// 공급자별 호출. 둘 다 오디오 바이트(Buffer)를 돌려준다
const spoken = j => j.text.replaceAll(KID, KID_SAY).replace(/^"(.*)"$/, "$1");
const persona = j => `${BASE} Voice: ${CAST[j.role][2]}. ${j.context}`;
async function ttsGemini(j) {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      input: [{ type: "user_input", content: [{ type: "text", text: spoken(j),
        annotations: [{ type: "speech_metadata", style: persona(j) }] }] }],
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice: CAST[j.role][0] }] },
    }),
  });
  if (!res.ok) return { status: res.status, error: await res.text() };
  const body = await res.json();
  // steps[] 중 model_output 단계의 audio 콘텐츠(base64 WAV)를 찾는다
  const audio = (body.steps || []).flatMap(s => s.content || []).find(c => c.type === "audio" && c.data);
  if (!audio) return { status: 0, error: "응답에 오디오가 없습니다: " + JSON.stringify(body).slice(0, 300) };
  return { data: Buffer.from(audio.data, "base64") };
}
async function ttsOpenAI(j) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice: CAST[j.role][1], input: spoken(j), response_format: "mp3", instructions: persona(j) }),
  });
  if (!res.ok) return { status: res.status, error: await res.text() };
  return { data: Buffer.from(await res.arrayBuffer()) };
}
const tts = PROVIDER === "gemini" ? ttsGemini : ttsOpenAI;

// WAV(16-bit PCM)에서 앞뒤 무음을 뺀 실제 말소리 구간 [시작초, 끝초]. 앱의 단어 하이라이트 타이밍에 쓴다
function wavBounds(buf) {
  let p = 12, rate = 24000, data = null;
  while (p + 8 <= buf.length) {
    const id = buf.toString("ascii", p, p + 4), size = buf.readUInt32LE(p + 4);
    if (id === "fmt ") rate = buf.readUInt32LE(p + 12);
    if (id === "data") { data = buf.subarray(p + 8, Math.min(buf.length, p + 8 + size)); break; }
    p += 8 + size + (size % 2);
  }
  if (!data) return null;
  const n = Math.floor(data.length / 2), win = Math.round(rate * 0.02), loud = [];
  for (let i = 0; i + win <= n; i += win) {
    let peak = 0;
    for (let k = i; k < i + win; k++) peak = Math.max(peak, Math.abs(data.readInt16LE(k * 2)));
    loud.push(peak > 1200);
  }
  const first = loud.indexOf(true), last = loud.lastIndexOf(true);
  if (first < 0) return null;
  return [+(first * win / rate).toFixed(2), +(((last + 1) * win) / rate).toFixed(2)];
}

const manifestPath = path.join(OUT, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const hashOf = j => crypto.createHash("sha1").update([PROVIDER, MODEL, BASE, ...CAST[j.role], j.text, j.context, KID_SAY].join("|")).digest("hex").slice(0, 10);
if (args.includes("--bounds")) {
  let n = 0;
  for (const [k, m] of Object.entries(manifest)) {
    if (!m.f.endsWith(".wav")) continue;
    const b = wavBounds(fs.readFileSync(path.join(OUT, m.f)));
    if (b) { [m.s, m.e] = b; n++; }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  console.log(`말소리 구간 계산 ${n}개`); process.exit(0);
}
const todo = jobs.filter(j => FORCE || manifest[j.key]?.h !== hashOf(j));
const chars = todo.reduce((n, j) => n + j.text.length, 0);
console.log(`[${PROVIDER} ${MODEL}] 클립 ${jobs.length}개 중 새로 만들 것 ${todo.length}개, 약 ${chars}자`);
if (DRY) { todo.forEach(j => console.log(`  ${j.key.padEnd(22)} [${j.role}] ${j.text}`)); process.exit(0); }
if (!process.env[KEY_ENV]) { console.error(`${KEY_ENV} 환경 변수가 없습니다.`); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
let done = 0, failed = 0;
for (const j of todo) {
  let r;
  for (let attempt = 1; attempt <= 5; attempt++) {
    r = await tts(j);
    if (r.status !== 429 && !(r.status >= 500)) break;
    const wait = 15000 * attempt;  // 무료 사용량 한도(분당 요청 수)에 걸리면 잠시 쉬었다 재시도
    console.log(`  … ${j.key}: ${r.status}, ${wait / 1000}초 후 재시도 (${attempt}/5)`);
    await sleep(wait);
  }
  if (!r.data) {
    failed++; console.error(`✗ ${j.key}: ${r.status} ${String(r.error).slice(0, 300)}`);
    if (r.status === 400 || r.status === 401 || r.status === 403 || r.status === 429) break;  // 키·요청 형식 문제면 바로 중단
    continue;
  }
  const file = `${j.key}.${EXT}`;
  // 같은 키의 예전 파일(다른 확장자)은 지운다
  if (manifest[j.key] && manifest[j.key].f !== file) fs.rmSync(path.join(OUT, manifest[j.key].f), { force: true });
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  fs.writeFileSync(path.join(OUT, file), r.data);
  manifest[j.key] = { f: file, h: hashOf(j) };
  const b = EXT === "wav" && wavBounds(r.data);
  if (b) [manifest[j.key].s, manifest[j.key].e] = b;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));  // 중간에 멈춰도 진행분 보존
  console.log(`✓ ${++done}/${todo.length} ${j.key}  [${CAST[j.role][PROVIDER === "gemini" ? 0 : 1]}] ${j.text}`);
}
console.log(`완료 ${done}개, 실패 ${failed}개`);
