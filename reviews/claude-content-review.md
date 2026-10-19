# 문장·대사 검토 (Claude, 2026-10-19)

10편, 약 150장면의 영어 문장, 대사, 해설, 질문, 한국어 힌트를 읽고 정리한 **고칠 후보**예요.
아직 반영하지 않았어요. Codex 검증 보고서(`reviews/codex-review.md`)와 합쳐서 한 번에 고쳐요.

- 한국어 힌트(8~12)는 화면에만 나와서 음성을 다시 만들 필요가 없어요.
- 영어 문장(2~7)을 고치면 그 문장의 음성만 `make_audio.mjs`가 알아서 다시 만들어요.

## 🔴 고치는 게 좋은 곳

| # | 위치 | 지금 | 고치면 | 이유 |
|---|---|---|---|---|
| 1 | gingerbread `moralKo` | 꾀 많은 말에 속지 않아요! | 꾀부리는 여우의 말에 속지 않아요! | 이야기에 말(馬)이 나와서 헷갈려요 |
| 2 | heungbu L1 s4 | Out comes gold and treasure! | Out come gold and treasure! | 복수 주어 |
| 3 | pigs L3 s5 | "Little pig, let me come in!" | "Little pig, little pig, let me come in!" | 원작의 반복 문장 |
| 4 | ant L1 s3 quiz | cold / cool / party | cold / hot / happy | party는 감정이 아니고 cool은 cold와 헷갈려요 |
| 5 | lion L1 s3 why, L3 s4 why | "A tiny mouse help me?" / "A tiny mouse help a king like me?" | "How can a tiny mouse help me?" / "How can a tiny mouse help a king like me?" | 배우는 아이에게 틀린 문장처럼 보여요 |

## 🟡 더 자연스럽게 (영어)

| # | 위치 | 지금 | 고치면 |
|---|---|---|---|
| 6 | lion L1 s2 | A tiny mouse runs on the lion's nose! | A tiny mouse runs across the lion's nose! |
| 7 | cinderella L1 s4 | glass shoes | glass slippers |

## 🟡 한국어 힌트

| # | 위치 | 지금 | 고치면 |
|---|---|---|---|
| 8 | lion L1 s5, L2 s7, L3 s8(ask 포함) | 냠냠냠! | 오독오독! |
| 9 | race L3 s7 | 다리는 아팠지만 | 다리는 무척 지쳤지만 |
| 10 | cinderella L3 s9 | 언니들은 밀고 쑤셔 넣었지만 | 언니들은 발을 억지로 밀어 넣어 봤지만 |
| 11 | goldenaxe L1 s2, s3 | "아니요, 아니에요." | "아니요, 제 것이 아니에요." |
| 12 | race L1 s1 | (말한 사람 없음) | 끝에 "토끼가 말해요." 추가 |

## 💡 참고 (고칠 필요 없음)
- 13. cinderella L1 s2는 무도회를 *party*라고 했어요. L1이라 쉬운 단어로 둔 거예요.
- 14. race는 L1에서 "the hare", L2·L3에서 "Hare"(이름처럼)를 써요. 단계 안에서는 일관돼요.
