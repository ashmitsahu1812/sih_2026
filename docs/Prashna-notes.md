# PRASHNA प्रश्न — demo script, limitations, backend handoff

Companion to `Prashna.jsx`. This build is **step 3 through step 11 of the build order, frontend only**, in a single React file. Steps 1, 2 and part of 12 (monorepo, Postgres, docker-compose, OpenAPI) are not built — see *Handoff* at the bottom.

---

## Three-minute judge walkthrough

Exact click path. Every number below matches an acceptance criterion.

**1 · Marathi, simulated ABHA scan, audio consent** — (criterion 1)
Kiosk tab → tap the idle screen → **मराठी** → **Scan my ABHA QR** → **Simulate scan** → consent screen speaks in Marathi, toggle *Record my history* → **मी सहमत आहे** → **Allopathy**.

**2 · Four questions, no typing** — (criterion 2)
- Q1 *त्रास कुठे आहे?* → hold the mic button, release. MockASR returns Marathi text with a confidence score, then auto-fills **छाती**.
- Q2 → hold the mic again → **वेदना**.
- Q3 *वेदना कशी आहे?* → tap the **दाबल्यासारखे जड** icon.
- Q4 *वेदना दुसरीकडे जाते का?* → tap **डाव्या हातात**.

**3 · Cardiac red flag on a second screen** — (criterion 3)
The kiosk interrupts with a calm Marathi message and no severity score. Open the **Triage** tab: `CARDIAC` is there with the triggering answer, a live since-alert timer, and **Acknowledge**. Back on the kiosk, *Staff use · continue intake* resumes the interview.

**4 · Confidence gate, both directions** — (criterion 4)
Continue to the document screen. Tap **Printed prescription** → three medicines extracted with per-field confidence. Tap **Handwritten note** → page confidence 0.42, refused, attached raw with the count of discarded fields. Pre-seeded patient **Sunita Devi** shows the same pair already in the timeline.

**4b · Language** — pick a different language on the idle screen and repeat step 2. All eight now carry full question text; Bengali, Telugu, Kannada and Gujarati are flagged in Demo control as awaiting native review. The doctor's summary stays English with the patient's own words underneath each field.

**5 · Provenance** — (criterion 5)
Doctor tab → **Ramesh Patil** → left column, any field → **source** → a modal with the exact sentence the patient said, the input method, the timestamp, and the original scan where the source was a document.

**6 · FHIR** — (criterion 6)
**Export FHIR R4 Bundle** → resource counts, pretty JSON, download.

**7 · Session wipe** — (criterion 7)
Back on the kiosk, finish the review screen → the done screen shows token, queue position and wait, then **Session cleared** and a 10-second return to idle.

### Two extras worth showing
- **Demo control → Simulate a noisy OPD**, then answer by voice. ASR returns 0.31, the kiosk switches that question to icon-only and says *गोंगाट आहे — कृपया चित्र निवडा* with the confidence printed next to it.
- **Lakshmi Iyer** in the queue is AYUSH mode with all ten Dashavidha Pariksha sections plus Agni, Koshtha, Nidra and Ahara.

---

## What is simulated

Every provider resolves to its mock. Nothing contacts a network.

| Provider | Real target | Activated by | Running here |
|---|---|---|---|
| ASR | Bhashini / AI4Bharat IndicConformer | `BHASHINI_API_KEY` | MockASR, canned per-question transcripts |
| TTS | Bhashini TTS | `BHASHINI_API_KEY` | Browser `SpeechSynthesis` |
| OCR | PaddleOCR / TrOCR service | `OCR_ENDPOINT` | MockOCR fixtures with hand-set confidences |
| Summariser | `claude-sonnet-4-6`, extractive prompt | `ANTHROPIC_API_KEY` | Deterministic rule-based summariser |
| ABDM | Sandbox M1–M3 | `ABDM_CLIENT_ID` | MockABDM, fake 14-digit ABHA, OTP `123456` |

Also simulated: the English column of the transcript panel is a gloss reconstructed from the structured answer, not machine translation. Bengali, Telugu, Kannada and Gujarati text was drafted for this build rather than supplied by a native speaker. Audio playback is disabled because audio is wiped at session end by design.

## Limitations

- **No clinical validation.** The seven red-flag rules come from standard triage teaching, not from a validated instrument. They need prospective sensitivity and specificity testing before any patient contact. `MENINGITIS` in particular is deliberately high-specificity and low-sensitivity — absence does not exclude.
- **`GI_BLEED` uses a proxy.** Abdominal rigidity requires palpation. The rule substitutes severity ≥ 8 with an abdominal site and says so in the trace shown to the doctor.
- **State is in memory.** Reloading the page resets everything. No database, no persistence, no multi-kiosk sync — the triage board updates because it shares React state, not because it is polling a server.
- **No authentication.** There is no doctor login at all in this build, hardcoded or otherwise. A real deployment needs hospital SSO and a per-clinician audit trail on every verify, edit and reject.
- **Eight language packs, four of them unreviewed.** Hindi, Marathi, Tamil and English were written into the question trees. Bengali, Telugu, Kannada and Gujarati were drafted for this build and have **not been checked by a native speaker**. A mistranslated symptom question is a clinical safety problem, not a copy problem — get all four read by a native-speaking clinician before any patient sees them. Demo control shows the review status per language, and coverage is counted at render time so the picker cannot claim more than the tables hold. The remaining 14 scheduled languages are architected, not shipped.
- **The doctor's summary is in clinical English by design.** English is what travels into FHIR and what a clinician who does not share the patient's language can read. The patient's own wording is shown beneath every field rather than hidden behind the provenance modal, and the untranslated transcript is preserved in `Provenance.entity.what.display`. What is *not* solved: there is no real machine translation, so the "English gloss" column beside the transcript is reconstructed from the structured answer, not translated from the audio.
- **Synthetic data only.** All three personas, all ABHA numbers, and all four document images are generated. The documents are drawn as SVG, not scraped.
- **No regulatory claim.** No ABDM certification, no CDSCO approval, no DPDP or HIPAA compliance attestation. ABDM integration is described as *Sandbox M1–M3, architecture ready*.

## Regulatory path a real deployment needs

ABDM Sandbox M1–M3 certification for ABHA and consent; ethics committee approval and a prospective triage-accuracy study before red flags drive any clinical action; CDSCO review of the classification question (this is currently a documentation aid, not a diagnostic device, and the boundary must be argued explicitly); a DPDP Act data-fiduciary assessment covering the consent artefact, retention and the wipe guarantee; and hospital-level sign-off on the fallback when the kiosk is down.

---

## Handoff — what to build next

Give the original prompt to Claude Code and point it at these, in this order:

1. **Monorepo + `run-demo.sh` + docker-compose** (build-order step 1). Not started.
2. **Postgres schema + Alembic + seed script** (step 2). The data model exists here as plain objects — `Patient`, `Session`, `Consent`, `Answer`, `Document`, `Extraction`, `RedFlag`, `Summary`, `FieldVerification` map one-to-one onto what the React state holds. The traceability constraint is enforced in `buildSummary`: a field is emitted only when it carries a `source`, and the smoke test asserts zero orphan fields across all three personas. Move that to a `NOT NULL` foreign key on `Summary.field → Answer.id | Extraction.id`.
3. **FastAPI service + OpenAPI at `/docs`**, then regenerate `packages/shared` types from the schema.
4. **Real provider adapters.** The interfaces are already the right shape — `transcribe(question, lang) → {text, pick, confidence}`, `speak(text, bcp)`, `runOcr(kind) → {pageConfidence, extractions[], isRawOnly}`. Swap the body, keep the signature, keep the `LIVE`/`SIMULATED` badge honest.
5. **Split the file.** `Prashna.jsx` is one file for portability. The section banners mark the natural boundaries: content trees → `content/`, red-flag engine → `rules/redFlags.ts`, providers → `providers/`, FHIR → `fhir/bundle.ts`, screens → `apps/kiosk` and `apps/dashboard`.

Known things I would fix first: the interview index is a position into the filtered question list, so going back and changing an answer that removes downstream questions can skip ahead — clamp it. And `soc.onset` is currently folded into `duration`; SOCRATES wants sudden-vs-gradual as its own question.
