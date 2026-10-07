# NC Decision — v2 usability + Programs / Official Sources architecture

Updated: 2026-10-07

## Product principle

The product must remain simple for the user while complexity stays inside the decision engine and the knowledge base.

External UX:
1. Enter OKED and territory.
2. Answer only questions that can materially change eligibility/status.
3. Receive a short result:
   - подходит;
   - почему;
   - ключевые условия;
   - что делать дальше.
4. Open the program card only if more detail is needed.

Internal architecture:
- deterministic Decision Engine;
- versioned knowledge base;
- traceable official sources;
- AI Expert explains grounded results and never invents missing facts.

## v2 usability package

Required before moving deeper into AI Expert:
- Normalize OKED input variants: C, 03.22, 03,22, 0322.
- Keep the result language user-oriented: "Подходит → Почему → Что дальше".
- Ask only status-changing clarification questions.
- Every clarification flow must support "Не знаю".
- Show data completeness honestly; do not call a partially filled profile "complete".
- Show verification date and official-source provenance.
- Improve readability and reduce equal-weight controls.
- Mark unavailable / future modules explicitly instead of presenting them as active.
- Preserve the user's workspace locally.
- Run UI acceptance tests after changes.

## Programs section

The Programs section is the user-facing catalogue of support measures.

Recommended hierarchy:

Programs
- Damu
  - Subsidies
  - Guarantees
  - Preferential financing
  - Leasing
  - Regional / MIO programs
- Banks
- FRP
- DBK
- ACC
- SPK
- Science Fund
- Other institutions

The diagnostic result must NOT send the user directly to an external website.

Result flow:
Diagnosis -> Internal Program Card -> Official Sources

## Program Card — visible layer

Keep the card compact.

Show:
- Program name
- Operator
- Status
- Who it is for
- Territory
- OKED / sector
- Financing purpose
- Maximum amount
- Borrower rate / subsidy
- Guarantee
- Term
- Important exclusions
- Last verified date

Primary action:
"Подробнее о программе"

Secondary disclosure:
"Официальные источники"

Do not show a long legal-source list by default.

## Official Sources — source hierarchy

### Tier 1 — normative / registry anchor

Use as the highest-authority source where applicable:
- Adilet / Etalon Control Bank;
- current government resolution / ministerial order / approved rules;
- official Register of State Support Measures for Private Entrepreneurship.

For Kazakhstan state-support measures, the current official register is based on Order No. 55 dated 20 June 2025 and subsequent amendments.

### Tier 2 — official operator document

Examples:
- approved rules;
- official PDF/DOCX terms;
- official program passport;
- official appendix with OKED;
- official regional/MIO document.

### Tier 3 — official operator program page

Examples:
- damu.kz program page;
- gov.kz official program page;
- official page of the relevant institution.

Use this as a user-friendly current presentation layer, not as the only legal foundation.

### Tier 4 — official operational evidence

Examples:
- official implementation reports;
- official presentations;
- funding-limit reports;
- official operator news / announcements.

These may confirm that a measure is operational or reflect recent implementation, but they must not override a higher-authority rule.

### Non-primary sources

Commercial legal portals, consultants, reposts, social media and third-party websites may be used only for discovery. They should not become primary evidence when an official source exists.

## Source data model

A program should not be anchored to one URL. Store source provenance separately.

Suggested fields:

program_id
institution_id
program_name
status
last_verified

sources[]:
- source_id
- source_role: primary | secondary | operational
- authority_level
- source_type
- title
- issuer
- document_number
- document_date
- effective_date
- url
- locator
- checked_on
- availability
- notes

For critical conditions, preserve the exact source linkage:

conditions[]:
- field_name
- value
- source_id
- source_locator
- confidence

This allows a program page to move or disappear without losing the evidence for the stored condition.

## Availability handling

If an operator page is empty, moved or returns "element not found":
- do not remove the program automatically;
- do not treat the empty page as proof of current conditions;
- fall back to the primary normative / official document;
- mark the operator page availability status;
- retain "needs_verification" when the current condition cannot be established from official evidence.

## AI Expert contract

Decision Engine decides.
AI Expert explains.

AI Expert receives structured facts:
- program_id;
- status;
- matched reasons;
- restrictions;
- missing inputs;
- financial terms;
- territory;
- OKED;
- source references;
- checked_at.

AI Expert must:
- explain the result in plain language;
- never upgrade "possible" to "eligible";
- never invent rates, limits, exclusions or documents;
- explicitly say what is unknown;
- ask only the next question that can change the result.

## Recommended result UX

### 1. Status
"Подходит"
"Потенциально подходит"
"Нужно уточнить"
"Нужно проверить"
"Не подходит"

### 2. Why
Maximum 2–4 short reasons.

### 3. Key terms
Only the metrics relevant to the selected program.

### 4. Next step
Examples:
- "Уточните сумму финансирования"
- "Проверьте отсутствие налоговой задолженности"
- "Откройте карточку программы"
- "Подготовьте заявку в банк-партнёр"

### 5. Evidence
Collapsed by default:
"Проверено по официальным источникам · 07.10.2026"

On open:
- Primary official source
- Operator document
- Official program page

## UX rationale

The interface should use progressive disclosure:
- ask only relevant questions;
- avoid making the user read legal eligibility rules;
- show a concise result first;
- reveal legal/source detail on demand;
- preserve answers and allow edits without restarting.

## Release sequence

1. Close v2 usability fixes.
2. Stabilize Programs / Official Sources architecture.
3. Populate Damu program catalogue using the source hierarchy.
4. Connect AI Expert only to structured Decision Engine output.
5. Run acceptance tests.
6. Prepare the user video guide before external feedback testing.

## Video guide — later release requirement

Before the first external feedback round, prepare a short video showing:
- navigation;
- what each section does;
- how to run a diagnosis;
- how to read statuses;
- what the report contains;
- how to open a program card and official sources;
- one complete real-world example.
