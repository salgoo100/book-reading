# Parking Lot

나중에 이어서 할 아이디어와 미뤄 둔 작업. 시작하면 "진행 중"으로 옮기고, 끝나면 지워요.

## 진행 중
- **Gemini 음성 남은 분량 만들기**: 6편 모두 Level 1~3이 앱에 들어가서 469개 남았어요 (2026-10-19 기준).
  - 우선순위: Level 1 나머지 → 각 이야기 Level 2 → Level 3
  - `gemini-3.8-flash-tts`는 Tier 1에서 하루 100번까지라 이틀에 나눠 만들어요. 명령은 `node --env-file=.env tools/make_audio.mjs`이고, 이미 만든 클립은 건너뛰어요.

- **문장 다듬기 (대기)**: 고칠 후보 14개를 `reviews/claude-content-review.md`에 정리했어요. Codex 검증 보고서(`codex-prompts/review.md` → `reviews/codex-review.md`)가 나오면 합쳐서 한 번에 고쳐요.

## 🎨 Codex 작업 큐 (Level 2·3용 새 그림 25장, 2026-10-19 모두 완료)
PowerShell, 프로젝트 폴더에서 한 줄씩 실행해요. 동시에 여러 개를 돌려도 돼요. 이야기마다 폴더가 달라서 겹치지 않아요.
끝나면 Claude에게 "끝났어"라고 알려주세요. 변환(`python tools/convert_images.py`), 확인, 배포는 Claude가 해요.

| ✔ | 이야기 | 장수 | 명령 |
|---|---|---|---|
| ✅ | 신데렐라 | 4 | `Get-Content codex-prompts/cinderella-levels.md -Raw \| codex exec --full-auto -` |
| ✅ | 사자와 쥐 | 4 | `Get-Content codex-prompts/lion-levels.md -Raw \| codex exec --full-auto -` |
| ✅ | 토끼와 거북이 | 4 | `Get-Content codex-prompts/race-levels.md -Raw \| codex exec --full-auto -` |
| ✅ | 개미와 베짱이 | 5 | `Get-Content codex-prompts/ant-levels.md -Raw \| codex exec --full-auto -` |
| ✅ | 양치기 소년 | 4 | `Get-Content codex-prompts/wolf-levels.md -Raw \| codex exec --full-auto -` |
| ✅ | 아기 돼지 삼형제 | 4 | `Get-Content codex-prompts/pigs-levels.md -Raw \| codex exec --full-auto -` |

그림이 먼저 나와도 괜찮아요. 신데렐라 말고는 Level 2·3 원고가 아직 앱에 들어가지 않아서, 그림은 원고를 넣을 때 연결돼요.

## 🎨 Codex 작업 큐: 새 이야기 4편 (각 6장, 총 24장, 2026-10-19 모두 완료)
원고와 데이터는 앱에 들어가 있어요. 그림이 들어오기 전까지는 이모지로 보여요.
PowerShell, 프로젝트 폴더에서 실행해요. 동시에 돌려도 돼요. 끝나면 Claude에게 알려주세요. 변환, 확인, 배포는 Claude가 해요.

| ✔ | 이야기 | 명령 |
|---|---|---|
| ✅ | 골디락스와 곰 세 마리 | `Get-Content codex-prompts/goldilocks.md -Raw \| codex exec --full-auto -` |
| ✅ | 진저브레드맨 | `Get-Content codex-prompts/gingerbread.md -Raw \| codex exec --full-auto -` |
| ✅ | 금도끼 은도끼 | `Get-Content codex-prompts/goldenaxe.md -Raw \| codex exec --full-auto -` |
| ✅ | 흥부와 놀부 | `Get-Content codex-prompts/heungbu.md -Raw \| codex exec --full-auto -` |

## 🎬 영상 모드 (유튜브 업로드용) — 기본 기능 완성 (2026-10-19)
첫 화면 맨 아래 **🎬 영상 모드 (녹화용)** 버튼, 또는 주소 끝에 `#video`. 아래는 원래 기획이고, 남은 아이디어는 맨 끝에 있어요.

"Read All"을 화면 녹화해서 유튜브에 올리기 위한 전용 화면이에요.

**화면**
- 버튼 없이 **큰 그림 + 자막(영어, 한국어는 선택)** 만 보여요.
- 장면이 자동으로 넘어가고, 시작 화면(제목)과 끝 화면(교훈)이 있어요.
- 16:9 가로 화면에 맞춰요.

**내용**
- 아이 이름 "Tae-ri"는 화면과 음성 모두 **"friend"** 로 바꿔요.
  - 음성은 이름이 들어간 클립만 영상용으로 따로 만들어야 해요.
- **Gemini 음성이 완성된 이야기만** 영상 모드에서 열려요.
  - 브라우저 기본 목소리는 녹화해서 공개하면 라이선스가 불분명해서 제외해요.
- 💬 Talk 질문은 영상에서 "생각할 시간" 연출로 쓸 수 있어요. 질문을 보여주고 잠시 멈추는 식이에요.

**업로드 체크리스트** (일반 정보, 법률 자문 아님)
- 유튜브 **"아동용(Made for Kids)"** 설정 (COPPA)
- 설명란에 **그림과 음성이 AI로 생성됨**이라고 밝히기
- 업로드 전에 Google Gemini API 약관을 다시 확인하기 (음성 출력물 사용 범위)
- 수익 창출을 할 거면 반복적인 AI 콘텐츠 정책을 고려해서 부모 목소리 해설 같은 직접 만든 요소 더하기
- 가족끼리 일부 공개로 나누는 건 부담이 적어요.

**남은 아이디어**: 시작과 끝에 짧은 음악, 이름이 들어간 Talk 질문을 "friend" 버전 음성으로 따로 만들기, 녹화 시간을 줄이는 빠른 넘김 옵션

## 💡 아이디어
- **새 이야기 4편**: 골디락스, 진저브레드맨, 금도끼 은도끼, 흥부와 놀부의 Level 1은 앱에 들어갔어요 (원고 `scenarios/new-stories-draft.md`). 그림은 완료했어요. 남은 일은 음성과 나중에 Level 2·3이에요.
- **나중 후보**: 빨간 암탉, 염소 삼형제, 커다란 순무, 잭과 콩나무, 미운 오리 새끼, 시골 쥐와 도시 쥐, 요정과 구두장이, 피터 래빗, 혹부리 영감, 해와 달이 된 오누이(호랑이 장면 순화 필요)
- **속도 조절 막대**: 기기마다 듣기 편한 속도가 달라서, 첫 화면에서 직접 맞추게 해요.
- **음성 용량 줄이기**: WAV를 MP3로 바꾸면 약 3분의 1이 돼요. 전체 음성은 약 25MB 예상이에요.
