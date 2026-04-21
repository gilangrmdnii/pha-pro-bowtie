# Software Requirements Specification (SRS)
## Integrated Risk Management System (IRMS)
### PHA-Pro + BowTie Unified Platform

---

| Field | Value |
|---|---|
| Document Type | Software Requirements Specification |
| Version | 1.1 (Draft for Development — Go + Vite stack) |
| Audience | Development Team (Backend, Frontend, QA, DevOps) |
| Domain | Process Safety / Risk Engineering |
| Status | Ready for Implementation |

> **Catatan buat tim dev:** Dokumen ini ditulis agar bisa langsung dipakai sebagai acuan coding. Setiap modul punya *functional requirements*, *business rules*, *acceptance criteria*, dan *data model* yang cukup untuk di-implement tanpa banyak asumsi. Domain ini (*process safety*) bukan CRUD biasa—baca **Section 2 (Domain Primer)** dulu sebelum coding.
>
> **Versi 1.1 note:** Stack diubah dari NestJS + Next.js ke **Go (Fiber) + Vite.js + React**. Domain logic, business rules, data model, dan arsitektur layered tetap sama — yang berubah hanya tooling, library spesifik, dan gaya implementasi.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Domain Primer (WAJIB DIBACA)](#2-domain-primer-wajib-dibaca)
3. [System Scope](#3-system-scope)
4. [Stakeholders & User Roles](#4-stakeholders--user-roles)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [Functional Requirements per Module](#6-functional-requirements-per-module)
7. [Data Model](#7-data-model)
8. [Business Rules & Domain Logic](#8-business-rules--domain-logic)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [API Design Guidelines](#11-api-design-guidelines)
12. [Tech Stack & Constraints](#12-tech-stack--constraints)
13. [Development Phases](#13-development-phases)
14. [Risks, Assumptions, Out-of-Scope](#14-risks-assumptions-out-of-scope)
15. [Glossary](#15-glossary)

---

## 1. Executive Summary

### 1.1 Tujuan Sistem

IRMS adalah platform *process safety management* yang mengintegrasikan dua kapabilitas utama dalam satu sistem:

- **Process Hazard Analysis (PHA)** dengan metode HAZOP — untuk *risk analysis* yang detail di level engineering.
- **BowTie Risk Visualization** — untuk komunikasi risiko ke manajemen dan stakeholder non-teknis.

Sistem ini menggantikan workflow konvensional di mana engineer harus menggunakan dua software terpisah (contoh: PHA-Pro oleh Sphera + BowTieXP oleh Wolters Kluwer) dan melakukan *manual data transfer* antara keduanya.

### 1.2 Value Proposition

| Masalah Saat Ini | Solusi IRMS |
|---|---|
| Data HAZOP dan BowTie terpisah, input ulang manual | Single source of truth, auto-mapping |
| Engineer dan manajemen pakai tool berbeda | Satu platform, dua view |
| Tracking *action item* tersebar di Excel/email | Built-in action tracking dengan traceability |
| Risk library tidak reusable antar proyek | Centralized library per organisasi |

### 1.3 Target User

Engineer, HSE officer, safety manager, dan operations leadership di industri:
- Oil & Gas
- Petrochemical
- Power Generation
- Heavy Manufacturing
- Mining

### 1.4 Non-Goal (Eksplisit Tidak Dibangun)

- Bukan clone 1:1 dari PHA-Pro atau BowTieXP (menghindari masalah legal IP).
- Tidak menyediakan *real-time process data ingestion* (bukan DCS/SCADA integration pada Phase 1).
- Tidak menangani *quantitative risk analysis* (QRA) tingkat lanjut pada Phase 1.
- Tidak menyediakan *physical modeling* (dispersion, fire, explosion modeling).

---

## 2. Domain Primer (WAJIB DIBACA)

Bagian ini untuk developer yang belum familiar dengan *process safety*. Tanpa memahami konsep ini, implementasi akan salah arah.

### 2.1 Konsep Inti

**Process Hazard Analysis (PHA)** adalah *framework* untuk mengidentifikasi bahaya pada proses industri. Ada beberapa metode, yang paling umum:

- **HAZOP** (Hazard and Operability Study) — qualitative, deviation-based.
- **LOPA** (Layer of Protection Analysis) — semi-quantitative.
- **FMEA** (Failure Mode and Effects Analysis) — component-based.

IRMS fokus pada **HAZOP** sebagai metode utama di Phase 1.

### 2.2 Struktur HAZOP

HAZOP menganalisis *deviation* dari kondisi normal operasi pada setiap bagian proses yang disebut **Node**.

Alur berpikir HAZOP:
```
Node (e.g., "Pipa inlet reaktor")
  └─ Parameter (e.g., "Flow")
       └─ Guide Word (e.g., "No")
            └─ Deviation (e.g., "No Flow")
                 └─ Cause (e.g., "Pompa mati")
                      └─ Consequence (e.g., "Reaktor overheat")
                           └─ Safeguard (e.g., "Temperature alarm")
                                └─ Recommendation (jika safeguard tidak cukup)
```

### 2.3 Guide Words Standar (IEC 61882)

| Guide Word | Meaning | Contoh Deviation |
|---|---|---|
| No / None | Negasi total | No Flow, No Pressure |
| More | Kuantitatif naik | More Flow, More Temperature |
| Less | Kuantitatif turun | Less Flow, Less Level |
| As Well As | Tambahan kualitatif | Contamination |
| Part Of | Kekurangan komposisi | Wrong composition |
| Reverse | Arah berlawanan | Reverse Flow |
| Other Than | Beda total | Wrong material |
| Early / Late | Timing | Early start |
| Before / After | Sequence | Out of sequence |

> **Implementation note:** Guide words harus *configurable* karena setiap perusahaan punya standar internal.

### 2.4 Risk Matrix

Setiap *consequence* dinilai berdasarkan dua dimensi:

- **Likelihood** (kemungkinan kejadian)
- **Severity** (keparahan dampak)

Hasil perkalian → **Risk Level** (Low, Medium, High, Extreme).

Matriks umumnya 5×5 tapi bisa 4×4 atau 6×6 tergantung *company standard*.

### 2.5 Konsep BowTie

BowTie adalah visualisasi risiko berbentuk dasi kupu-kupu:

```
  THREAT 1 ──┐                         ┌── CONSEQUENCE 1
  THREAT 2 ──┼──[BARRIER]──▶ TOP EVENT ──[BARRIER]──┼── CONSEQUENCE 2
  THREAT 3 ──┘                         └── CONSEQUENCE 3
           (Preventive)              (Mitigative)
```

**Komponen BowTie:**

| Komponen | Penjelasan | Sumber di HAZOP |
|---|---|---|
| **Top Event** | Peristiwa hilangnya kontrol | Deviation utama |
| **Threat** | Penyebab yang bisa memicu top event | Cause |
| **Consequence** | Dampak jika top event terjadi | Consequence |
| **Preventive Barrier** | Kontrol yang mencegah threat → top event | Safeguard (preventive) |
| **Mitigative Barrier** | Kontrol yang mengurangi dampak top event → consequence | Safeguard (mitigative) |
| **Escalation Factor** | Kondisi yang melemahkan barrier | (New in BowTie layer) |
| **Escalation Control** | Kontrol terhadap escalation factor | (New in BowTie layer) |

### 2.6 Hubungan HAZOP ↔ BowTie (INTI SISTEM)

Ini **yang paling penting** untuk dev team pahami:

- HAZOP = *tabular, detailed, bottom-up*
- BowTie = *visual, relational, top-down*
- Satu Top Event di BowTie biasanya = satu Deviation atau gabungan beberapa Deviation di HAZOP.
- Satu Safeguard di HAZOP dapat menjadi satu Barrier di BowTie, tapi pemetaannya **tidak selalu 1:1** — ada klasifikasi preventive vs mitigative yang perlu *explicit* di schema.

---

## 3. System Scope

### 3.1 In-Scope (Phase 1 MVP)

1. User authentication dengan role-based access control.
2. Multi-project, multi-asset hierarchy management.
3. HAZOP worksheet lengkap dengan guide words configurable.
4. Risk matrix configurable (4×4, 5×5, 6×6).
5. Action & recommendation tracking.
6. Auto-generation BowTie diagram dari HAZOP data.
7. Manual editing BowTie (drag & drop).
8. Reusable library (cause, consequence, safeguard).
9. Export PDF & Excel.
10. Audit log & versioning.

### 3.2 In-Scope (Phase 2)

1. Real-time collaboration (multiple engineer, satu workshop).
2. Advanced barrier logic (escalation factor, effectiveness scoring).
3. LOPA (semi-quantitative analysis).
4. Advanced reporting dashboard.

### 3.3 In-Scope (Phase 3)

1. AI-assisted cause/consequence suggestion.
2. Integration dengan DMS (Document Management System).
3. Multi-tenant SaaS deployment.

### 3.4 Out-of-Scope (selamanya, kecuali change request)

- Physical dispersion modeling.
- Integrasi dengan DCS/SCADA.
- Mobile-first design (web responsive cukup).
- On-premise installer (cloud-only).

---

## 4. Stakeholders & User Roles

### 4.1 Personas

**Persona 1: Safety Engineer (Primary User)**
- Melakukan HAZOP session sebagai *scribe*.
- Input deviation, cause, consequence, safeguard.
- Update action item.
- Menggunakan sistem 60-80% waktu kerjanya saat ada proyek.

**Persona 2: HAZOP Team Leader**
- Memimpin workshop, review hasil scribe.
- Approve/reject recommendation.
- Assign action ke engineer lain.

**Persona 3: HSE Manager**
- Review BowTie diagram untuk decision making.
- Monitor status action items.
- Butuh dashboard high-level, bukan worksheet detail.

**Persona 4: External Consultant**
- Akses terbatas ke project tertentu.
- Read-only atau limited write.

**Persona 5: System Admin**
- Manage user, role, organization settings.
- Configure risk matrix, guide words template.

### 4.2 Role & Permission Matrix

| Feature | Admin | Manager | Team Leader | Engineer (Scribe) | Viewer / Consultant |
|---|---|---|---|---|---|
| Create Project | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Project | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/Edit Node | ✅ | ✅ | ✅ | ✅ | ❌ |
| Input HAZOP Worksheet | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve Recommendation | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign Action | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate BowTie | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit BowTie | ✅ | ✅ | ✅ | ✅ | ❌ |
| View BowTie | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configure Risk Matrix | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export Report | ✅ | ✅ | ✅ | ✅ | ✅ (limited) |
| View Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 5. System Architecture Overview

### 5.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              Client (Vite + React 18 SPA)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ HAZOP Module │  │ BowTie Canvas│  │ Dashboard/Reports │   │
│  └──────┬───────┘  └───────┬──────┘  └────────┬─────────┘   │
└─────────┼──────────────────┼───────────────────┼─────────────┘
          │                  │                   │
          ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│          API Gateway — Go (Fiber v2) REST + WebSocket         │
│          Middleware: JWT, RBAC, CORS, Rate Limit, Logger      │
└──────────────────────────────────────────────────────────────┘
          │                  │                   │
┌─────────▼────────┐ ┌───────▼──────┐ ┌──────────▼──────────┐
│  HAZOP Service   │ │Mapping Engine│ │ BowTie Service       │
│  (CRUD + Logic)  │ │ (Core Logic) │ │ (Graph + Auto-gen)   │
└─────────┬────────┘ └───────┬──────┘ └──────────┬──────────┘
          │                  │                   │
          ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│         PostgreSQL 15+ (Primary DB)   +   Redis (Cache)       │
│         Access via GORM v2 (atau sqlc untuk raw query)        │
└──────────────────────────────────────────────────────────────┘
          │                            │
          ▼                            ▼
┌────────────────────────┐ ┌──────────────────────────────────┐
│ S3-compatible Storage  │ │ Async Worker — asynq (Redis)     │
│ (report, attachment)   │ │ (report gen, bulk import, email) │
└────────────────────────┘ └──────────────────────────────────┘
```

### 5.2 Layered Design (Backend — Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│  Delivery Layer (internal/delivery/http)                 │  ← Fiber handlers
│  - HTTP handlers, WebSocket handlers, DTOs, validation   │
├─────────────────────────────────────────────────────────┤
│  Usecase / Application Layer (internal/usecase)          │  ← Business workflows
│  - Orchestrate domain services, transaction boundaries   │
├─────────────────────────────────────────────────────────┤
│  Domain Layer (internal/domain)                          │  ← HAZOP, BowTie, Mapping
│  - Entities, value objects, domain services, interfaces  │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer (internal/infra)                   │  ← External concerns
│  - GORM repos, Redis client, S3 client, email, queue     │
└─────────────────────────────────────────────────────────┘
```

> **Design principle:** Letakkan semua business rules di Domain Layer. Jangan taruh logic di handler atau usecase saja — domain ini kompleks dan akan di-unit test secara terpisah tanpa butuh DB.

### 5.3 Recommended Backend Folder Structure

```
irms-backend/
├── cmd/
│   ├── api/              # main.go untuk HTTP API server
│   └── worker/           # main.go untuk async worker (asynq)
├── internal/
│   ├── domain/           # Entities, domain services, interfaces (ports)
│   │   ├── hazop/
│   │   ├── bowtie/
│   │   ├── mapping/
│   │   ├── risk/
│   │   └── user/
│   ├── usecase/          # Application services, orchestration
│   ├── delivery/
│   │   ├── http/         # Fiber handlers, DTO, middleware
│   │   └── ws/           # WebSocket handlers (Phase 2)
│   ├── infra/
│   │   ├── postgres/     # GORM repos — implement domain interfaces
│   │   ├── redis/
│   │   ├── s3/
│   │   ├── email/
│   │   └── queue/        # asynq task definitions
│   └── pkg/              # Shared utilities
│       ├── auth/         # JWT helpers
│       ├── logger/       # zap wrapper
│       ├── validator/    # go-playground/validator wrapper
│       └── config/       # viper loader
├── migrations/           # SQL migration files (golang-migrate)
├── scripts/
├── api/                  # OpenAPI specs (optional)
├── go.mod
├── go.sum
├── Dockerfile
└── docker-compose.yml
```

### 5.4 Recommended Frontend Folder Structure

```
irms-frontend/
├── public/
├── src/
│   ├── app/              # App shell, providers, router setup
│   ├── pages/            # Route-level components (HAZOP, BowTie, Dashboard)
│   ├── features/         # Feature modules (colocated hooks, components, API)
│   │   ├── hazop/
│   │   ├── bowtie/
│   │   ├── auth/
│   │   ├── project/
│   │   └── action/
│   ├── components/       # Shared UI components (shadcn/ui-based)
│   ├── hooks/
│   ├── lib/              # api client (ky/axios), utils, constants
│   ├── stores/           # Zustand stores
│   ├── types/            # Shared TS types (mirror backend DTO)
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Functional Requirements per Module

### Module 1: Authentication & User Management

#### 6.1.1 Description
Sistem autentikasi berbasis JWT dengan *refresh token* dan *role-based access control* (RBAC). Di Go, JWT dihandle via `github.com/golang-jwt/jwt/v5`; RBAC enforced via middleware Fiber.

#### 6.1.2 Functional Requirements

**FR-AUTH-001: User Registration (Admin-only)**
- Admin dapat mengundang user baru via email.
- User menerima invitation link dengan token berlaku 48 jam.
- User set password sendiri saat first login.

**FR-AUTH-002: Login**
- Input: email + password.
- Output: access token (15 min) + refresh token (7 days).
- Lockout: 5 failed attempts → akun terkunci 15 menit (counter disimpan di Redis dengan TTL).

**FR-AUTH-003: Role Assignment**
- Setiap user punya 1 *organization-level role* (Admin, Manager).
- Setiap user bisa punya *project-level role* berbeda per proyek (Team Leader di Project A, Engineer di Project B).

**FR-AUTH-004: Session Management**
- Token refresh endpoint.
- Logout invalidates refresh token (blacklist JTI di Redis dengan TTL = sisa masa berlaku token).

#### 6.1.3 Acceptance Criteria
- [ ] User tidak bisa akses endpoint tanpa valid JWT (middleware `AuthRequired()` menolak dengan 401).
- [ ] Role-based middleware (`RequireRole("admin")`) memblokir akses ke endpoint yang tidak diizinkan (return 403).
- [ ] Audit log mencatat setiap login, logout, dan failed attempt.

---

### Module 2: Project & Asset Management

#### 6.2.1 Description
Modul untuk membuat dan mengelola proyek beserta struktur asetnya. Hirarki asset mengikuti standar industri:

```
Organization
  └─ Project (e.g., "Kilang A - Debottlenecking 2026")
       └─ Plant (e.g., "Unit Crude Distillation")
            └─ Section (e.g., "Preheat Train")
                 └─ Equipment (e.g., "Heat Exchanger E-101")
                      └─ Node (unit analisis HAZOP)
```

#### 6.2.2 Functional Requirements

**FR-PROJ-001: Create Project**
- Required fields: `name`, `code`, `facility_type`, `start_date`, `end_date`.
- Optional: `description`, `location`, `client_name`.
- System auto-generate `project_id` (UUID via `github.com/google/uuid`).

**FR-PROJ-002: Asset Hierarchy CRUD**
- User dapat create/read/update/delete entitas pada setiap level hirarki.
- Validation: tidak bisa delete parent jika masih ada child (enforce di usecase layer).
- Soft delete (flag `deleted_at`), bukan hard delete. GORM `gorm.DeletedAt` cocok untuk ini.

**FR-PROJ-003: Node Management**
- Node adalah unit terkecil untuk HAZOP analysis.
- Setiap node wajib punya: `name`, `description`, `design_intent`, `parameters[]`, `operating_conditions`.
- Node dapat di-duplicate (copy dengan semua child data) untuk akselerasi setup.

**FR-PROJ-004: Project Template**
- User dapat save project sebagai template.
- Template dapat digunakan sebagai starting point project baru.

#### 6.2.3 Acceptance Criteria
- [ ] Struktur hirarki tersimpan dengan benar (parent-child relationship).
- [ ] User dengan role "Engineer" hanya melihat project yang dia *assigned*.
- [ ] Audit log mencatat create/update/delete pada setiap entitas.

---

### Module 3: HAZOP Analysis Module (CORE)

> **Prioritas #1** untuk development. Ini jantung sistem.

#### 6.3.1 Description
Modul untuk conduct HAZOP session. UI utamanya adalah **worksheet table** (mirip spreadsheet) dengan kolom yang sesuai standar industri. Frontend pakai TanStack Table + virtualization untuk handle 1000+ rows tanpa lag.

#### 6.3.2 Worksheet Columns (Standard)

| # | Column | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Node | FK | ✅ | Dari Project tree |
| 2 | Parameter | Enum/FK | ✅ | Flow, Pressure, Temperature, Level, dll |
| 3 | Guide Word | Enum/FK | ✅ | No, More, Less, Reverse, dll |
| 4 | Deviation | String | ✅ | Auto-suggest dari Param + GuideWord |
| 5 | Cause | Relation[] | ✅ | Bisa multiple |
| 6 | Consequence | Relation[] | ✅ | Bisa multiple |
| 7 | Safeguard (Existing) | Relation[] | ⚠️ | Boleh kosong |
| 8 | Severity (S) | Int 1-5 | ✅ | Sebelum safeguard |
| 9 | Likelihood (L) | Int 1-5 | ✅ | Sebelum safeguard |
| 10 | Risk Rank (Initial) | Computed | - | L × S |
| 11 | Safeguard Effectiveness | Enum | ⚠️ | Weak/Moderate/Strong |
| 12 | Severity (Residual) | Int 1-5 | ⚠️ | Setelah safeguard |
| 13 | Likelihood (Residual) | Int 1-5 | ⚠️ | Setelah safeguard |
| 14 | Risk Rank (Residual) | Computed | - | L × S |
| 15 | Recommendation | Relation[] | ⚠️ | Jika residual masih tinggi |
| 16 | Responsible Party | FK User | ⚠️ | Untuk action |
| 17 | Due Date | Date | ⚠️ | |
| 18 | Status | Enum | - | Open / In Progress / Closed |
| 19 | Remarks | Text | ⚠️ | |

#### 6.3.3 Functional Requirements

**FR-HAZOP-001: Create Worksheet Entry**
- User memilih Node aktif.
- System menampilkan kolom wajib.
- Auto-suggest Deviation berdasarkan kombinasi Parameter + Guide Word.
  - Example: "Flow" + "No" → suggest "No Flow"
  - Example: "Temperature" + "More" → suggest "More Temperature / High Temperature"
- Auto-calculate Risk Rank (Initial & Residual) — kalkulasi dilakukan di server (Go), bukan client.

**FR-HAZOP-002: Bulk Operations**
- Copy row / duplicate row.
- Move row (re-order).
- Filter row by: Node, Guide Word, Risk Rank, Status.
- Export filtered view ke Excel (pakai `github.com/xuri/excelize/v2` di backend).

**FR-HAZOP-003: Library Integration**
- Saat input *Cause*, *Consequence*, *Safeguard* — system menampilkan *autocomplete* dari library organisasi.
- Jika user input value baru, offer "Save to library for future use".
- Link ke library entity (FK), bukan copy value.

**FR-HAZOP-004: Guide Word Management**
- Admin dapat create custom guide words per organisasi.
- Guide words dapat disusun dalam set (e.g., "IEC 61882 Standard", "Company XYZ Standard").
- Setiap project menggunakan satu set aktif.

**FR-HAZOP-005: Session Mode**
- Ada mode "Workshop" dengan UI yang lebih besar/presenter-friendly.
- Scribe mengisi sambil leader dan tim diskusi.
- (Phase 2) Real-time collaboration via WebSocket (Fiber native WebSocket support via `github.com/gofiber/contrib/websocket`).

**FR-HAZOP-006: Validation Rules**
- Row tidak bisa di-save jika: Node kosong, Parameter kosong, Guide Word kosong, Deviation kosong, Cause kosong, Consequence kosong, S & L Initial kosong.
- Warning (bukan error) jika: Safeguard kosong tapi Risk Rank Initial ≥ High.
- Error jika: Risk Rank Residual > Risk Rank Initial (logic error, tidak mungkin).
- Server-side validation via `go-playground/validator`; client-side validation via Zod (React Hook Form resolver).

#### 6.3.4 Acceptance Criteria
- [ ] User dapat input 100 rows worksheet tanpa page reload, tanpa lag (<200ms per save).
- [ ] Auto-suggestion Deviation bekerja untuk semua kombinasi Parameter × Guide Word yang ada di library.
- [ ] Filter & sort berfungsi tanpa memanggil server (client-side pagination acceptable untuk <1000 rows).
- [ ] Worksheet dapat di-export ke Excel dengan format siap print.

---

### Module 4: Risk Assessment & Matrix

#### 6.4.1 Description
Konfigurasi dan aplikasi risk matrix untuk menilai setiap skenario risiko.

#### 6.4.2 Functional Requirements

**FR-RISK-001: Matrix Configuration**
- Admin dapat create matrix dengan dimensi N×M (umumnya 5×5).
- Setiap cell punya: `color` (hex), `label` (Low/Medium/High/Extreme), `action_required` (text).
- Matrix dapat di-save sebagai template organisasi.

**FR-RISK-002: Severity & Likelihood Definition**
- Setiap level Severity (1-5) punya deskripsi multi-dimensi:
  - People (injury level)
  - Environment (contamination level)
  - Asset (damage cost range)
  - Reputation (impact level)
- Setiap level Likelihood (1-5) punya definisi frekuensi:
  - Example: "Level 5 = Occurs more than once per year"
  - Example: "Level 1 = Less than once in 10,000 years"

**FR-RISK-003: Risk Calculation**
- Risk Rank = Severity × Likelihood.
- Mapping ke cell di matrix → return label & color.
- Calculation deterministic dan dilakukan server-side (di domain service Go), tidak boleh manipulable client-side.

**FR-RISK-004: Tolerability Threshold**
- Admin set threshold: "Risk level X requires action".
- System auto-flag row yang melebihi threshold untuk review.

#### 6.4.3 Acceptance Criteria
- [ ] Risk rank kalkulasi konsisten antara initial dan residual.
- [ ] Matrix dapat di-export sebagai gambar untuk report.
- [ ] Ganti matrix active tidak merusak data existing (historical calculation preserved via `risk_matrix_version`).

---

### Module 5: BowTie Visualization Module

#### 6.5.1 Description
Modul untuk membuat dan edit BowTie diagram. Auto-populate dari HAZOP data, dengan opsi manual editing. Frontend pakai **React Flow v12+** (library canvas untuk graph/diagram yang solid & well-maintained).

#### 6.5.2 Canvas Structure

```
[Threats Column]    [Preventive Barriers]     [Top Event]     [Mitigative Barriers]    [Consequences Column]

  Threat 1 ─┐
  Threat 2 ─┼──[Barrier A]──[Barrier B]──▶ ○ ──[Barrier C]──[Barrier D]──┬─ Conseq 1
  Threat 3 ─┘                                                             ├─ Conseq 2
                                                                          └─ Conseq 3
```

#### 6.5.3 Functional Requirements

**FR-BOWTIE-001: Auto-Generation from HAZOP**
- User memilih Node atau Deviation sebagai basis.
- System otomatis:
  - Map Deviation → Top Event (center).
  - Map Cause → Threat (left side).
  - Map Consequence → Consequence (right side).
  - Map Safeguard (preventive) → Preventive Barrier.
  - Map Safeguard (mitigative) → Mitigative Barrier.
- Classification preventive vs mitigative: default-nya based on `safeguard_type` field; user bisa override.
- Generation dilakukan di backend (Go), hasil dikirim sebagai JSON untuk di-render React Flow.

**FR-BOWTIE-002: Manual Editing**
- Drag & drop untuk reposisi node (handled by React Flow).
- Add/remove threat, consequence, barrier secara manual.
- Edit label & tipe barrier.
- Undo/redo (minimum 10 steps) — pakai state history di Zustand.

**FR-BOWTIE-003: Barrier Properties**
- Tiap barrier punya properties:
  - `name`
  - `type` (Preventive / Mitigative)
  - `category` (Hardware / Procedure / Human Action / Software)
  - `effectiveness` (Weak / Moderate / Strong) — Phase 2
  - `owner` (FK User atau Department)

**FR-BOWTIE-004: Escalation Factor (Phase 2)**
- Setiap barrier dapat punya *escalation factor* (kondisi yang melemahkan barrier).
- Escalation factor dapat punya *escalation control* (kontrol terhadapnya).
- Ditampilkan sebagai sub-node yang terhubung ke barrier parent.

**FR-BOWTIE-005: View Modes**
- **Simple Mode**: hanya tampilkan threat, top event, consequence (untuk manajemen).
- **Detailed Mode**: dengan semua barrier dan escalation (untuk engineer).
- **Presentation Mode**: fullscreen, minim UI chrome.

**FR-BOWTIE-006: Sync dengan HAZOP**
- Jika HAZOP worksheet diubah, BowTie *auto-update flag* muncul (server mengirim `last_synced_at` vs `last_modified_at`).
- User decide: merge changes, atau keep manual edits.
- Konflik resolution: UI diff view.

#### 6.5.4 Acceptance Criteria
- [ ] Auto-generate diagram dari HAZOP dalam <2 detik untuk node dengan <20 deviation.
- [ ] Drag & drop smooth tanpa lag pada diagram dengan <100 nodes.
- [ ] Export diagram ke PNG, SVG, dan PDF (PNG/SVG via `react-flow`'s `toPng`/`toSvg` helper; PDF via backend compose).
- [ ] Edit di BowTie *tidak* meng-overwrite HAZOP data secara default (one-way sync by default).

---

### Module 6: Mapping Engine (CRITICAL CORE)

> **Most complex module.** Implementasi salah di sini → sistem rusak secara fundamental.

#### 6.6.1 Description
Komponen backend (Go) yang menangani transformasi dan relasi antara HAZOP entities dan BowTie entities. Ditulis sebagai **pure domain service** tanpa dependency ke framework (Fiber/GORM) — supaya gampang di-unit test.

#### 6.6.2 Mapping Rules

**Rule M-001: Cause → Threat**
- Setiap Cause di HAZOP menjadi 1 Threat di BowTie.
- Relasi: `Threat.source_cause_id = Cause.id`.
- Jika Cause sama dipakai di beberapa Deviation, di BowTie tetap 1 Threat (deduplication by `cause_id`).

**Rule M-002: Consequence → Consequence (BowTie)**
- Setiap Consequence di HAZOP menjadi 1 Consequence di BowTie.
- Relasi: `BowTieConsequence.source_consequence_id = HAZOPConsequence.id`.
- Deduplication logic sama seperti Threat.

**Rule M-003: Safeguard → Barrier**
- Safeguard diklasifikasi berdasarkan `safeguard_function`:
  - Prevention: → Preventive Barrier
  - Detection: → Preventive Barrier (early warning)
  - Mitigation: → Mitigative Barrier
  - Emergency Response: → Mitigative Barrier
- Satu Safeguard dapat menjadi Barrier di banyak Threat (reusable).
- Relasi: M:N via `BarrierThreatMap` atau `BarrierConsequenceMap`.

**Rule M-004: Deviation → Top Event**
- Satu Top Event di BowTie dapat mewakili:
  - Satu Deviation tunggal, ATAU
  - Gabungan beberapa Deviation yang punya *same loss of containment* (e.g., "More Pressure" + "Less Flow" keduanya lead ke "Overpressure Event").
- User yang menentukan grouping ini secara manual (tidak fully auto).

**Rule M-005: Bidirectional Traceability**
- Dari BowTie element, user dapat klik "Trace to HAZOP" → jump ke row HAZOP yang menjadi sumbernya.
- Dari HAZOP row, user dapat klik "View in BowTie" → highlight element di diagram.

#### 6.6.3 Sync Strategy

**Strategi: One-Way Sync dengan Manual Reconciliation**

```
HAZOP (source of truth) ──[auto-sync]──▶ BowTie (derived view)
HAZOP ◀──[manual copy-back]── BowTie (jika ada edit manual di BowTie)
```

Alasan: HAZOP adalah dokumen engineering yang harus tetap jadi source of truth. BowTie adalah visualisasi. Edit di BowTie boleh, tapi bukan default flow.

**Conflict detection:**
- Setiap entity punya `last_synced_at` dan `last_modified_at`.
- Jika `last_modified_at` > `last_synced_at` pada HAZOP → show "BowTie outdated" badge.
- User klik "Sync" → system merge dengan strategy yang user pilih:
  - Overwrite BowTie with HAZOP (destroy manual edits)
  - Keep BowTie manual edits (ignore HAZOP changes)
  - Manual merge per element

#### 6.6.4 Acceptance Criteria
- [ ] Auto-generation untuk node dengan 20 deviation dan 50 cause < 3 detik.
- [ ] Bidirectional traceability link bekerja di kedua arah.
- [ ] Konflik sync tidak menyebabkan data loss (selalu ada snapshot sebelum merge, stored di `bowtie_snapshots`).
- [ ] Unit test coverage untuk mapping logic ≥ 90% (via `go test -cover`).

---

### Module 7: Action & Recommendation Tracking

#### 6.7.1 Description
Tracking item actionable yang muncul dari HAZOP (biasanya berupa rekomendasi peningkatan safeguard atau pemasangan kontrol baru).

#### 6.7.2 Functional Requirements

**FR-ACTION-001: Action Creation**
- Action otomatis ter-create saat user input "Recommendation" di HAZOP worksheet.
- Fields: `title`, `description`, `priority` (auto from risk rank), `assignee`, `due_date`, `status`.

**FR-ACTION-002: Lifecycle States**
- States: `Open` → `In Progress` → `Under Review` → `Closed` / `Rejected`.
- State transition dibatasi role (enforced via domain service + middleware):
  - Engineer: Open → In Progress, In Progress → Under Review.
  - Manager/Leader: Under Review → Closed/Rejected.
- Reject memerlukan `reason` (required field).

**FR-ACTION-003: Notifications**
- Email notification (via SMTP atau provider seperti SendGrid) saat:
  - Action di-assign ke user.
  - Due date mendekati (H-3, H-1, overdue) — dijalankan oleh cron worker (asynq scheduler).
  - Status berubah.
- In-app notification untuk hal yang sama (WebSocket push, Phase 2).

**FR-ACTION-004: Dashboard View**
- Kanban board: kolom per status.
- List view dengan filter: priority, assignee, due date, project.
- Overdue actions selalu di-highlight merah.

**FR-ACTION-005: Linking & Traceability**
- Setiap action link back ke: Project > Node > HAZOP Row.
- Klik action → jump ke HAZOP row terkait.

#### 6.7.3 Acceptance Criteria
- [ ] Action tidak bisa ditutup tanpa `closure_evidence` (text atau attachment).
- [ ] Audit log lengkap untuk setiap state change.
- [ ] Dashboard load <1s untuk 500 action items.

---

### Module 8: Library Management

#### 6.8.1 Description
Centralized library untuk reuse cause, consequence, safeguard, recommendation across projects dalam satu organisasi.

#### 6.8.2 Library Entities

| Library | Purpose | Example Entries |
|---|---|---|
| Cause Library | Common root causes | "Pump failure", "Control valve stuck open", "Operator error" |
| Consequence Library | Common impacts | "Toxic release", "Fire in adjacent unit", "Asset damage" |
| Safeguard Library | Reusable controls | "PSV at 110% design", "Fire & gas detection", "Emergency shutdown" |
| Recommendation Library | Template recommendations | "Install high-high alarm", "Review operating procedure" |

#### 6.8.3 Functional Requirements

**FR-LIB-001: Library CRUD**
- Admin & Manager dapat manage library entries.
- Engineer dapat *propose* entry baru (status `pending` sampai di-approve).

**FR-LIB-002: Autocomplete Integration**
- Saat user type di HAZOP worksheet field Cause/Consequence/Safeguard, system suggest dari library.
- Fuzzy matching pada `name` dan `keywords` — pakai PostgreSQL `pg_trgm` extension untuk similarity search, atau Redis-cached list untuk library kecil.

**FR-LIB-003: Usage Tracking**
- System track berapa kali tiap library entry dipakai.
- Display sebagai `usage_count` untuk prioritasi di suggestion (paling sering dipakai di atas).

**FR-LIB-004: Categorization & Tagging**
- Setiap entry punya `category` (e.g., "Mechanical", "Process Control", "Human Factors").
- Free-form tags untuk pencarian.

#### 6.8.4 Acceptance Criteria
- [ ] Autocomplete response <100ms untuk library dengan 10,000 entries (caching Redis + index `pg_trgm`).
- [ ] Entry yang dipakai di HAZOP tidak dapat di-hard-delete (soft delete dengan flag `archived`).
- [ ] Import library dari CSV untuk bootstrap library organisasi.

---

### Module 9: Reporting & Export

#### 6.9.1 Description
Generate dokumen output standar industri untuk audit, compliance, dan komunikasi.

#### 6.9.2 Report Types

**Report 1: HAZOP Worksheet Report**
- Format: PDF dengan landscape A3 atau Excel.
- Isi: full worksheet per Node, plus header (project info, team members, date).
- Template: konfigurasi layout oleh admin.

**Report 2: BowTie Diagram Report**
- Format: PDF atau high-res PNG/SVG.
- Isi: diagram + legend + metadata.

**Report 3: Risk Register**
- Format: Excel.
- Isi: semua risk entries di project, sorted by risk rank.

**Report 4: Action Tracker Report**
- Format: Excel atau PDF.
- Isi: list action dengan status, assignee, due date.

**Report 5: Executive Summary**
- Format: PDF single page atau PowerPoint slide.
- Isi: project overview, top 10 risks, action progress, key BowTie diagrams.

#### 6.9.3 Functional Requirements

**FR-REPORT-001: Template Engine**
- Go `text/template` atau `html/template` sebagai basis.
- Untuk Excel: `github.com/xuri/excelize/v2`.
- Untuk PDF: `github.com/jung-kurt/gofpdf` atau render HTML → PDF via headless Chrome (`chromedp`) untuk output yang lebih rapi.
- Admin dapat upload custom template (DOCX with placeholders — gunakan `github.com/nguyenthenguyen/docx` atau serupa).
- Template dapat berbeda per organisasi (white-label support).

**FR-REPORT-002: Async Generation**
- Report generation dilakukan di background job via **asynq** (Redis-backed queue, equivalent BullMQ di ekosistem Go).
- User mendapat notifikasi (email + in-app) saat report siap.
- Report disimpan di S3-compatible storage, link valid 7 hari (signed URL).

**FR-REPORT-003: Scheduled Reports**
- User dapat schedule weekly/monthly report ke email tertentu — pakai asynq scheduler atau `robfig/cron`.

#### 6.9.4 Acceptance Criteria
- [ ] Report 100-page HAZOP generated dalam <30 detik.
- [ ] PDF output compliant dengan format cetak A3/A4 landscape.
- [ ] Report diakses via signed URL dengan expiry.

---

### Module 10: Audit Log & Versioning

#### 6.10.1 Description
Tracking semua perubahan dalam sistem untuk compliance (e.g., OSHA, ISO 45001 audit trail requirements).

#### 6.10.2 Functional Requirements

**FR-AUDIT-001: Immutable Audit Log**
- Every create/update/delete operation logged dengan: `user_id`, `timestamp`, `action`, `entity_type`, `entity_id`, `changes` (JSON diff), `ip_address`.
- Log tidak dapat di-edit atau di-delete (append-only table — enforce di DB level via trigger yang menolak UPDATE/DELETE).
- Implementation: GORM hook `AfterCreate`/`AfterUpdate`/`AfterDelete` di domain entity → write ke `audit_logs`.

**FR-AUDIT-002: Entity Versioning**
- Entity kritis (HAZOP row, BowTie, Project) punya `version` counter.
- History per entity dapat di-view (revision history).
- Restore ke version sebelumnya (create new version dengan content lama, jangan rewrite history).

**FR-AUDIT-003: Audit Report**
- Admin dapat filter audit log by user, date range, action type, entity type.
- Export audit log ke CSV untuk external audit.

**FR-AUDIT-004: Snapshot System**
- Sebelum sync HAZOP → BowTie, create snapshot.
- Snapshot dapat di-restore jika terjadi data loss.

#### 6.10.3 Acceptance Criteria
- [ ] Audit log entry ter-create untuk setiap mutation tanpa kecuali.
- [ ] Audit log query dengan filter selesai <500ms untuk table 1M rows (dengan proper indexing).
- [ ] Restore version tidak merusak referensial integrity.

---

## 7. Data Model

### 7.1 Core Entities (Simplified ERD)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Organization │───1:N─│    User      │──N:M──│   Role       │
└──────┬───────┘       └──────┬───────┘       └──────────────┘
       │                      │
      1:N                     │
       │                      │
       ▼                      │
┌──────────────┐              │
│   Project    │──────N:M─────┘
└──────┬───────┘
       │
      1:N
       │
       ▼
┌──────────────┐
│    Plant     │
└──────┬───────┘
       │
      1:N
       │
       ▼
┌──────────────┐
│   Section    │
└──────┬───────┘
       │
      1:N
       │
       ▼
┌──────────────┐
│  Equipment   │
└──────┬───────┘
       │
      1:N
       │
       ▼
┌──────────────┐       ┌────────────┐       ┌────────────┐
│    Node      │──1:N──│ Deviation  │──1:N──│   Cause    │
└──────────────┘       └─────┬──────┘       └─────┬──────┘
                             │                    │
                            1:N                  N:M
                             │                    │
                             ▼                    ▼
                       ┌────────────┐       ┌────────────┐
                       │Consequence │       │ Safeguard  │
                       └─────┬──────┘       └────────────┘
                             │
                            N:M
                             │
                             ▼
                       ┌────────────┐
                       │ Safeguard  │
                       └────────────┘
```

### 7.2 Primary Tables

> Semua `id` pakai UUIDv7 (pakai `github.com/google/uuid` v1.6+ atau `github.com/gofrs/uuid`). UUIDv7 punya ordering temporal untuk indexing yang lebih baik dibanding UUIDv4.

#### Table: `organizations`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| subscription_tier | VARCHAR(20) | `free`, `pro`, `enterprise` (CHECK constraint) |
| created_at | TIMESTAMPTZ | DEFAULT now() |

#### Table: `users`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL (bcrypt cost 12) |
| full_name | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | `admin`, `manager`, `engineer`, `viewer` |
| status | VARCHAR(20) | `active`, `suspended`, `invited` |
| last_login_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

#### Table: `projects`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations |
| code | VARCHAR(50) | UNIQUE per org |
| name | VARCHAR(255) | NOT NULL |
| facility_type | VARCHAR(100) | |
| status | VARCHAR(20) | `planning`, `active`, `completed`, `archived` |
| start_date | DATE | |
| end_date | DATE | |
| risk_matrix_id | UUID | FK → risk_matrices |
| guide_word_set_id | UUID | FK → guide_word_sets |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| deleted_at | TIMESTAMPTZ | NULLABLE (GORM soft delete) |

#### Table: `nodes`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| equipment_id | UUID | FK → equipments |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| design_intent | TEXT | |
| operating_conditions | JSONB | Temp, pressure, flow, etc. |
| drawing_reference | VARCHAR(255) | P&ID number |
| sequence_number | INT | For ordering |
| created_at | TIMESTAMPTZ | |

#### Table: `deviations`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| node_id | UUID | FK → nodes |
| parameter_id | UUID | FK → parameters |
| guide_word_id | UUID | FK → guide_words |
| deviation_description | VARCHAR(500) | NOT NULL |
| sequence_number | INT | |

#### Table: `causes`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| deviation_id | UUID | FK → deviations |
| library_cause_id | UUID | FK → library_causes (nullable) |
| description | TEXT | NOT NULL |
| cause_category | VARCHAR(100) | |

#### Table: `consequences`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| deviation_id | UUID | FK → deviations |
| library_consequence_id | UUID | FK → library_consequences (nullable) |
| description | TEXT | NOT NULL |
| severity_initial | SMALLINT | 1-5 (CHECK) |
| likelihood_initial | SMALLINT | 1-5 (CHECK) |
| severity_residual | SMALLINT | NULLABLE |
| likelihood_residual | SMALLINT | NULLABLE |
| impact_categories | JSONB | `{"people":4,"env":3,"asset":2,"reputation":3}` |

#### Table: `safeguards`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| library_safeguard_id | UUID | FK (nullable) |
| description | TEXT | NOT NULL |
| safeguard_type | VARCHAR(20) | `preventive`, `mitigative`, `both` |
| safeguard_function | VARCHAR(30) | `prevention`, `detection`, `control`, `mitigation`, `emergency_response` |
| category | VARCHAR(20) | `hardware`, `procedure`, `human_action`, `software` |
| effectiveness | VARCHAR(20) | `weak`, `moderate`, `strong` (Phase 2) |

#### Junction Table: `cause_safeguards`
| Field | Type | Constraints |
|---|---|---|
| cause_id | UUID | FK, PK (composite) |
| safeguard_id | UUID | FK, PK (composite) |
| added_by | UUID | FK → users |

#### Junction Table: `consequence_safeguards`
| Field | Type | Constraints |
|---|---|---|
| consequence_id | UUID | FK, PK (composite) |
| safeguard_id | UUID | FK, PK (composite) |

#### Table: `recommendations`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| deviation_id | UUID | FK → deviations |
| description | TEXT | NOT NULL |
| priority | VARCHAR(20) | `low`, `medium`, `high`, `critical` |
| assigned_to | UUID | FK → users |
| due_date | DATE | |
| status | VARCHAR(20) | `open`, `in_progress`, `under_review`, `closed`, `rejected` |
| closure_evidence | TEXT | |
| closed_at | TIMESTAMPTZ | |
| closed_by | UUID | FK → users |

#### Table: `bowtie_diagrams`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → projects |
| node_id | UUID | FK → nodes (nullable, bisa cross-node) |
| top_event | VARCHAR(500) | NOT NULL |
| description | TEXT | |
| layout_data | JSONB | Node positions, zoom, pan |
| last_synced_at | TIMESTAMPTZ | |
| last_modified_at | TIMESTAMPTZ | |
| created_by | UUID | FK → users |

#### Table: `bowtie_elements`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| diagram_id | UUID | FK → bowtie_diagrams |
| element_type | VARCHAR(30) | `threat`, `consequence`, `preventive_barrier`, `mitigative_barrier`, `escalation_factor`, `escalation_control` |
| source_entity_type | VARCHAR(50) | e.g., `cause`, `consequence`, `safeguard` |
| source_entity_id | UUID | Polymorphic FK |
| label | VARCHAR(500) | |
| position | JSONB | `{"x":..., "y":...}` |
| properties | JSONB | Type-specific properties |
| is_manual | BOOLEAN | true jika user-added, false jika auto-gen |

#### Table: `bowtie_connections`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| diagram_id | UUID | FK → bowtie_diagrams |
| source_element_id | UUID | FK → bowtie_elements |
| target_element_id | UUID | FK → bowtie_elements |
| connection_type | VARCHAR(30) | `threat_to_event`, `event_to_consequence`, `barrier_chain` |

#### Table: `risk_matrices`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations |
| name | VARCHAR(255) | |
| dimensions | JSONB | `{"rows":5, "cols":5}` |
| cells | JSONB | Array of `{row, col, label, color, action}` |
| severity_definitions | JSONB | Per-level descriptions |
| likelihood_definitions | JSONB | Per-level descriptions |
| is_default | BOOLEAN | |

#### Table: `guide_words` & `guide_word_sets`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| set_id | UUID | FK → guide_word_sets |
| word | VARCHAR(50) | e.g., "No", "More", "Less" |
| meaning | VARCHAR(255) | |
| applicable_parameters | JSONB | Which parameters this applies to |

#### Table: `audit_logs`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| action | VARCHAR(100) | `create`, `update`, `delete`, `login`, etc. |
| entity_type | VARCHAR(100) | |
| entity_id | UUID | |
| changes | JSONB | Before/after diff |
| ip_address | INET | IPv4/IPv6 (Postgres `inet` type) |
| user_agent | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### 7.3 Indexing Strategy

Critical indexes (dibuat via migrasi SQL di `migrations/`):
- `users(email)` — UNIQUE index for login.
- `projects(organization_id, deleted_at)` — filter active projects per tenant.
- `deviations(node_id)` — load HAZOP worksheet.
- `causes(deviation_id)`, `consequences(deviation_id)` — worksheet population.
- `audit_logs(entity_type, entity_id, created_at DESC)` — history lookup.
- `recommendations(assigned_to, status)` — user dashboard.
- `bowtie_elements(diagram_id, element_type)` — diagram rendering.
- GIN index di `library_causes USING gin (name gin_trgm_ops)` — fuzzy autocomplete (butuh `CREATE EXTENSION pg_trgm`).

### 7.4 Multi-Tenancy Strategy

**Pattern: Discriminator Column (shared database, shared schema)**

- Setiap table yang berisi tenant data punya `organization_id`.
- Setiap query di-filter `WHERE organization_id = :current_org`.
- Enforce di Repository layer dengan GORM global scope / middleware yang inject `organization_id` ke context.

Contoh Go:

```go
func TenantScope(orgID uuid.UUID) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("organization_id = ?", orgID)
    }
}

// Usage in repo:
db.Scopes(TenantScope(ctx.Value("org_id").(uuid.UUID))).Find(&projects)
```

> **CRITICAL:** Jangan pernah lupa tenant filter. Satu query salah → data bocor antar tenant. Consider **PostgreSQL Row-Level Security (RLS)** sebagai second layer — set `SET LOCAL app.current_org_id = '...'` di awal transaction, lalu enable RLS policy di setiap tenant table.

### 7.5 ORM Strategy — GORM vs sqlc

**Default: GORM v2** untuk CRUD standar (lebih cepat develop, hooks untuk audit log).

**Pakai sqlc** untuk query yang:
- Kompleks (multi-join, CTE, window function).
- Performance-critical (mapping engine, dashboard aggregation).
- Butuh type safety maksimal.

Kombinasi ini common di project Go production-grade — GORM untuk 80% CRUD, sqlc untuk 20% hot path.

---

## 8. Business Rules & Domain Logic

Bagian ini berisi *invariants* yang harus dijaga sistem. Melanggar rule di bawah = bug domain. Rule-rule ini harus di-enforce di **domain layer Go**, bukan hanya di UI.

### 8.1 HAZOP Rules

**BR-HAZOP-001:** Satu Deviation minimum punya 1 Cause dan 1 Consequence. Tidak boleh ada Deviation tanpa keduanya (soft-enforce di UI, hard-enforce saat submit).

**BR-HAZOP-002:** Severity dan Likelihood adalah integer 1-5 (atau sesuai dimensi matrix yang aktif). Validasi via `validator` tag: `validate:"min=1,max=5"`.

**BR-HAZOP-003:** Risk Rank Residual ≤ Risk Rank Initial. Jika lebih besar = input error (safeguard tidak mungkin memperburuk risiko).

**BR-HAZOP-004:** Jika Risk Rank Residual masih di zona "Extreme" atau "High" → Recommendation **wajib** (tidak bisa submit tanpa recommendation).

**BR-HAZOP-005:** Safeguard tidak boleh dihapus jika sedang di-referensikan di Cause atau Consequence yang aktif. Harus di-unlink dulu, atau soft-delete.

### 8.2 BowTie Rules

**BR-BOWTIE-001:** Satu BowTie diagram harus punya **minimum 1** Top Event, **minimum 1** Threat, dan **minimum 1** Consequence. Diagram tanpa salah satu = invalid, tidak dapat di-save.

**BR-BOWTIE-002:** Barrier harus terhubung ke minimum 1 Threat (untuk preventive) atau minimum 1 Consequence (untuk mitigative). Barrier "melayang" tidak boleh.

**BR-BOWTIE-003:** Threat tidak bisa langsung connect ke Consequence tanpa melewati Top Event. Flow graph ini strict:
```
Threat → [Preventive Barriers] → Top Event → [Mitigative Barriers] → Consequence
```

**BR-BOWTIE-004:** Satu Safeguard dari HAZOP dapat muncul sebagai multiple barrier di BowTie (reuse), tapi setiap instance punya `position` dan `connection` yang unik di diagram.

**BR-BOWTIE-005:** Edit di BowTie yang bersifat *structural* (add/remove element) tidak auto-write back ke HAZOP. User harus explicit "Apply to HAZOP".

### 8.3 Risk Matrix Rules

**BR-RISK-001:** Satu project hanya boleh punya 1 risk matrix aktif pada satu waktu.

**BR-RISK-002:** Mengubah risk matrix di tengah project akan **membekukan** risk rank existing (historical data pakai matrix lama, data baru pakai matrix baru). Sistem track `risk_matrix_version` per entry.

**BR-RISK-003:** Cell di risk matrix harus punya label yang konsisten: tidak boleh 2 cell dengan warna dan label yang sama di lokasi inkonsisten (e.g., Low-Severity/Low-Likelihood tidak boleh "High").

### 8.4 Action & Recommendation Rules

**BR-ACTION-001:** Action yang statusnya `Closed` tidak bisa di-edit kecuali oleh Admin (dan create new audit log entry).

**BR-ACTION-002:** Action `Rejected` harus punya `rejection_reason` yang informatif (min 20 karakter).

**BR-ACTION-003:** Due date tidak boleh di masa lalu saat action di-create.

**BR-ACTION-004:** Prioritas action otomatis di-derive dari risk rank:
- Extreme → Critical
- High → High
- Medium → Medium
- Low → Low

User bisa override manual, tapi system log perubahannya.

### 8.5 Access Control Rules

**BR-ACCESS-001:** User hanya dapat akses project di mana dia *assigned* (ada entry di `project_members` table).

**BR-ACCESS-002:** Organization Admin dapat akses semua project di organisasinya (bypass project-level assignment).

**BR-ACCESS-003:** Super Admin (sistem provider) tidak dapat akses data customer (zero-trust). Support hanya dapat masuk dengan *impersonation token* yang valid <1 jam dan selalu ter-log.

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metric | Target | Measurement |
|---|---|---|
| API response time (p95) | <300ms | Excluding file upload/export |
| HAZOP worksheet load (100 rows) | <1s | First paint |
| BowTie diagram render (50 nodes) | <1.5s | Initial render |
| Auto-sync HAZOP → BowTie | <3s | For 20 deviations |
| Report generation (100-page PDF) | <30s | Async, notify on complete |
| Concurrent users per project | 20+ | No degradation in response time |
| Database size handling | 10M rows per tenant | Without re-architecture |

> Go umumnya memberi p95 lebih agresif dibanding Node.js untuk beban ini. Target di atas adalah *upper bound*; realistis bisa lebih baik.

### 9.2 Scalability

- Horizontal scaling: backend stateless, session di Redis.
- Worker queue (asynq) untuk task berat (report generation, bulk import).
- Database: read replica untuk reporting queries (Phase 2+).
- Go compile ke single binary → deployment gampang (Docker image size < 30 MB dengan `scratch` base).

### 9.3 Availability

- Target SLA: 99.5% uptime (Phase 1), 99.9% (Phase 2+).
- Scheduled maintenance window: max 4 hours/month, di luar jam kerja customer.
- Backup: daily automated via `pg_dump`, retention 30 hari. Point-in-time recovery capability (WAL archiving) di Phase 2.
- Graceful shutdown: trap SIGTERM di `main.go`, drain in-flight request, close DB/Redis connection.

### 9.4 Security

**Authentication:**
- JWT dengan RS256 signing (pakai `github.com/golang-jwt/jwt/v5`).
- Access token di `Authorization: Bearer`, refresh token di httpOnly cookie.
- MFA (TOTP) optional Phase 1 (pakai `github.com/pquerna/otp`), wajib untuk Admin Phase 2.

**Authorization:**
- RBAC di semua endpoint via **Fiber middleware** (`RequireRole`, `RequirePermission`).
- Row-level security (PostgreSQL RLS) untuk tenant isolation (second layer selain filter di repo).

**Data Protection:**
- Password hashing: **bcrypt** cost 12 (pakai `golang.org/x/crypto/bcrypt`) atau **Argon2id** (`golang.org/x/crypto/argon2`).
- Data-at-rest: PostgreSQL encryption (via cloud provider e.g. AWS RDS encryption).
- Data-in-transit: TLS 1.2+ (enforce di reverse proxy / Fiber).
- Sensitive fields (e.g., closure_evidence jika berisi info sensitif): column-level encryption opsional via `pgcrypto`.

**Compliance:**
- Audit log lengkap (untuk SOC 2, ISO 27001 readiness).
- GDPR: support data export (JSON/CSV) dan "right to be forgotten" (anonymization, bukan hard delete, karena audit log harus preserved).
- Data retention policy configurable per tenant.

**Application Security:**
- OWASP Top 10 mitigation (default practices).
- Rate limiting: 100 req/min per user via `github.com/gofiber/fiber/v2/middleware/limiter` (store backend: Redis).
- CORS strict: `github.com/gofiber/fiber/v2/middleware/cors` — only allowed origins.
- CSP headers via `github.com/gofiber/helmet/v2`.
- Input validation: **`github.com/go-playground/validator/v10`** di setiap request DTO struct.
- SQL injection prevention: GORM parameterized queries / sqlc type-safe codegen (jangan ada `fmt.Sprintf` untuk build SQL).
- Security scanning di CI: **`gosec`**, **`govulncheck`**, **`trivy`** (container scan).

### 9.5 Usability

- Web responsive (desktop-first, tablet-compatible).
- Keyboard navigation penuh untuk HAZOP worksheet (mirip Excel: Tab, Enter, Arrow keys) — handled di React TanStack Table + custom keyboard handler.
- Bahasa: Indonesia + English (i18n dari Phase 1) — pakai **`react-i18next`** di frontend, `golang.org/x/text/message` di backend untuk error message translation.
- Color-blind safe palette untuk risk matrix (provide pattern sebagai tambahan warna).

### 9.6 Maintainability

- Code coverage minimum 70% untuk service/usecase layer, 90% untuk domain logic (`go test -coverprofile`).
- **Linting backend:** `golangci-lint` dengan config strict (enabled: gosimple, govet, staticcheck, unused, errcheck, ineffassign, gocyclo, gosec).
- **Formatting backend:** `gofmt` + `goimports` (enforced di pre-commit).
- **Linting frontend:** ESLint + Prettier + TypeScript strict mode.
- Conventional Commits (enforced via `commitlint` + husky di frontend repo, `gitleaks` + `lefthook` di backend repo).
- API versioning via URL prefix (`/api/v1/...`).
- Database migration terkontrol: **`golang-migrate/migrate`** atau **`pressly/goose`** — file SQL up/down yang di-version.

### 9.7 Observability

- Structured logging (JSON) via **`go.uber.org/zap`** atau **`rs/zerolog`** (pilih salah satu; zap lebih populer untuk production).
- Application metrics: Prometheus format via `github.com/prometheus/client_golang`, exposed di `/metrics`.
- Error tracking: Sentry via `github.com/getsentry/sentry-go` (backend) + `@sentry/react` (frontend).
- Distributed tracing: **OpenTelemetry** (`go.opentelemetry.io/otel`) dengan OTLP exporter ke Tempo/Jaeger (Phase 2).
- Health check endpoints: `/healthz` (liveness), `/readyz` (readiness — cek DB + Redis).

---

## 10. UI/UX Requirements

### 10.1 Design System

- Build tool: **Vite 5+** (fast HMR, native ESM, build via Rollup).
- Component library: **shadcn/ui** (copy-paste components, built on Radix UI + Tailwind — bukan npm package, jadi fully customizable).
- Typography: Inter untuk body, JetBrains Mono untuk code/data.
- Color palette: neutral base + accent per severity (configurable karena risk color adalah *safety-critical semantic*).
- Icons: **lucide-react** (konsisten dengan shadcn/ui default).

### 10.2 Key Screens

**Screen 1: Project Dashboard**
- Top: project metadata card.
- Left sidebar: asset hierarchy tree.
- Main: tab switcher (HAZOP | BowTie | Actions | Reports).
- Right: activity feed.

**Screen 2: HAZOP Worksheet**
- Spreadsheet-like interface pakai **TanStack Table v8** + `@tanstack/react-virtual` untuk row virtualization.
- Sticky header row, sticky first column (Node/Parameter).
- Inline editing dengan validation (React Hook Form + Zod).
- Keyboard shortcuts:
  - `Tab` / `Shift+Tab`: next/prev cell
  - `Enter`: next row
  - `Ctrl+D`: duplicate row
  - `Ctrl+K`: open library search (command palette pakai `cmdk`)
  - `Esc`: cancel edit

**Screen 3: BowTie Canvas**
- Infinite canvas pakai **React Flow v12+** (pan & zoom, auto-layout, edge routing built-in).
- Left toolbar: element palette (drag to add).
- Right sidebar: property panel untuk selected element.
- Top toolbar: zoom, layout auto-arrange (ELK.js atau dagre integration), undo/redo, sync status, export.
- Mini-map di pojok kanan bawah (React Flow built-in `MiniMap`).

**Screen 4: Action Dashboard (Kanban)**
- Columns: Open | In Progress | Under Review | Closed.
- Cards draggable antar column pakai **dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`).
- Filter bar: assignee, priority, due date, project.

**Screen 5: Risk Matrix Configuration**
- Interactive grid editor.
- Click cell → open color picker + label editor.
- Preview panel.

### 10.3 Accessibility

- WCAG 2.1 Level AA compliance (target).
- Keyboard navigation di semua interactive element (Radix UI primitives default accessible).
- ARIA labels di chart/diagram.
- Focus indicator yang jelas (Tailwind `focus-visible:` utilities).
- Minimum tap target 44×44px.

### 10.4 Wireframe References

> Wireframe detail di-generate terpisah (Figma link akan di-provide). SRS ini mendefinisikan *struktur*, bukan *visual*.

---

## 11. API Design Guidelines

### 11.1 Conventions

- RESTful dengan exception untuk endpoint yang secara natural non-REST (e.g., `POST /api/v1/hazop/:id/generate-bowtie`).
- JSON only (no XML).
- Versioning: `/api/v1/`, `/api/v2/`.
- Pagination: cursor-based untuk large dataset (`?cursor=...&limit=50`). Cursor = base64-encoded composite of `(created_at, id)`.
- Filtering: query params (`?status=open&assignee_id=...`).
- Sorting: `?sort=-created_at` (prefix `-` untuk descending).
- Request/response struct di Go pakai tag: `json:"field_name"` + `validate:"required,min=1"`.

### 11.2 Response Structure

**Success:**
```json
{
  "data": { ... },
  "meta": {
    "pagination": { "cursor_next": "...", "has_more": true }
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Severity must be between 1 and 5",
    "details": [
      { "field": "severity_initial", "message": "Out of range" }
    ],
    "trace_id": "abc-123-..."
  }
}
```

Di Go, bikin standardized error response helper:

```go
type APIError struct {
    Code    string   `json:"code"`
    Message string   `json:"message"`
    Details []Detail `json:"details,omitempty"`
    TraceID string   `json:"trace_id"`
}

func (h *Handler) respondError(c *fiber.Ctx, status int, err APIError) error {
    err.TraceID = c.Locals("trace_id").(string)
    return c.Status(status).JSON(fiber.Map{"error": err})
}
```

### 11.3 Key Endpoint Categories

| Group | Base Path | Description |
|---|---|---|
| Auth | `/api/v1/auth` | Login, logout, refresh, reset password |
| Users | `/api/v1/users` | User management |
| Projects | `/api/v1/projects` | Project CRUD |
| Nodes | `/api/v1/nodes` | Node + hierarchy |
| HAZOP | `/api/v1/hazop` | Worksheet operations |
| BowTie | `/api/v1/bowtie` | Diagram operations |
| Mapping | `/api/v1/mapping` | Sync operations |
| Risk Matrix | `/api/v1/risk-matrices` | Matrix config |
| Actions | `/api/v1/actions` | Action tracking |
| Library | `/api/v1/library` | Reusable entities |
| Reports | `/api/v1/reports` | Report generation |
| Audit | `/api/v1/audit` | Audit log query |

### 11.4 Sample Endpoints (Illustrative)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id

GET    /api/v1/projects/:id/nodes
POST   /api/v1/nodes
GET    /api/v1/nodes/:id
PATCH  /api/v1/nodes/:id

# HAZOP worksheet
GET    /api/v1/nodes/:id/deviations
POST   /api/v1/deviations
PATCH  /api/v1/deviations/:id
POST   /api/v1/deviations/:id/causes
POST   /api/v1/deviations/:id/consequences
POST   /api/v1/causes/:id/safeguards     # Link existing safeguard

# BowTie
POST   /api/v1/bowtie/diagrams
GET    /api/v1/bowtie/diagrams/:id
PATCH  /api/v1/bowtie/diagrams/:id/layout
POST   /api/v1/bowtie/diagrams/:id/elements

# Mapping (critical operation)
POST   /api/v1/mapping/hazop-to-bowtie     # Body: { node_id | deviation_ids[] }
GET    /api/v1/mapping/sync-status/:diagram_id
POST   /api/v1/mapping/resolve-conflict/:diagram_id

# Reports (async)
POST   /api/v1/reports/generate            # Returns job_id (asynq task ID)
GET    /api/v1/reports/jobs/:job_id        # Check status
GET    /api/v1/reports/:id/download        # Signed S3 URL
```

### 11.5 WebSocket Events (Phase 2)

Untuk real-time collaboration, pakai Fiber's WebSocket middleware (`github.com/gofiber/contrib/websocket`):

```
# Client → Server
hazop:cell.lock          # Locking cell for edit
hazop:cell.update
hazop:cell.unlock

# Server → Client (broadcast via Redis pub/sub untuk multi-instance)
hazop:cell.locked        # Broadcast kalau user lain edit
hazop:cell.updated
hazop:user.joined
hazop:user.left
```

---

## 12. Tech Stack & Constraints

### 12.1 Recommended Stack

**Frontend:**
- Build tool: **Vite 5+**
- Framework: **React 18+** (19 when stable)
- Language: **TypeScript** (strict mode, `"strict": true`)
- Routing: **React Router v6+** (atau TanStack Router untuk type-safe routing)
- Styling: **Tailwind CSS v3+**
- Components: **shadcn/ui** (Radix UI primitives + Tailwind)
- State (client): **Zustand** (hindari Redux untuk project size ini)
- State (server): **TanStack Query v5+**
- Graph/Diagram: **React Flow v12+**
- Tables: **TanStack Table v8** + `@tanstack/react-virtual`
- Forms: **React Hook Form** + **Zod** (schema validation)
- HTTP client: **ky** atau **axios** (wrap with TanStack Query)
- Icons: **lucide-react**
- Drag & drop: **dnd-kit**
- Testing: **Vitest** + **React Testing Library** + **MSW** (API mocking)
- E2E: **Playwright**

**Backend:**
- Language: **Go 1.22+** (gunakan LTS-ish version)
- Web framework: **Fiber v2** (rekomendasi utama — Express-like API, performant, WebSocket support)
  - Alternatif: **Gin** (lebih populer, komunitas besar) atau **Echo**
- ORM: **GORM v2** untuk CRUD; **sqlc** untuk hot-path queries
- Database driver: `github.com/jackc/pgx/v5` (di-wrap GORM atau dipakai langsung oleh sqlc)
- Auth: **`golang-jwt/jwt/v5`** + custom middleware
- Password hashing: **`golang.org/x/crypto/bcrypt`**
- Validation: **`go-playground/validator/v10`**
- Config: **`spf13/viper`** atau **`caarlos0/env`** (YAML + env var)
- Logger: **`go.uber.org/zap`** (structured, high-performance)
- Queue: **`hibiken/asynq`** (Redis-backed, equivalent BullMQ)
- Cache: **`redis/go-redis/v9`**
- S3 client: **`aws/aws-sdk-go-v2`** atau **`minio/minio-go`** (kompatibel dengan MinIO + AWS S3)
- UUID: **`google/uuid`** (dukung UUIDv7)
- Testing: stdlib `testing` + **`stretchr/testify`** + **`testcontainers-go`** (integration test dengan real Postgres)
- Mocking: **`uber-go/mock`** (successor of golang/mock) atau **`vektra/mockery`**
- HTTP testing: pakai `httptest` stdlib + Fiber's testing helper
- Excel: **`xuri/excelize/v2`**
- PDF: **`chromedp/chromedp`** (HTML → PDF via headless Chrome) atau `jung-kurt/gofpdf`
- Email: **`go-mail/mail/v2`** (SMTP), atau HTTP client ke SendGrid/Resend API
- Migration: **`golang-migrate/migrate`** atau **`pressly/goose`**

**Database:**
- Primary: **PostgreSQL 15+**
- Extensions: `uuid-ossp` atau UUIDv7 via Go, `pg_trgm` (fuzzy search), `pgcrypto` (optional encryption).
- Features used: JSONB, full-text search, row-level security.

**Infrastructure:**
- Container: **Docker** + **Docker Compose** (Phase 1), Kubernetes (Phase 2+).
- CI/CD: **GitHub Actions** (lint → test → build → scan → deploy).
- Reverse proxy: **Nginx** atau **Caddy** (auto TLS).
- Monitoring: **Prometheus** + **Grafana**.
- Error tracking: **Sentry**.
- Logs: **Grafana Loki** atau ELK.

### 12.2 Constraints

- **Browser support:** Last 2 versions Chrome, Firefox, Edge, Safari. IE/legacy = out.
- **Go:** 1.22+ (stable). Bisa upgrade ke LTS berikutnya tanpa breaking change major untuk library yang di-pin.
- **Node.js (untuk build FE):** LTS 20.x atau 22.x.
- **Database version:** PostgreSQL 15+ (butuh fitur modern JSONB indexing + RLS policy improvements).
- **Network:** Cloud-hosted deployment. On-premise out of scope Phase 1.

### 12.3 Third-Party Services

| Service | Purpose | Alternatif |
|---|---|---|
| SendGrid / Resend | Transactional email | AWS SES, Mailgun |
| AWS S3 / Cloudflare R2 | File storage | MinIO (self-host) |
| Sentry | Error tracking | Self-host GlitchTip |
| Stripe | Billing (jika SaaS) | Midtrans / Xendit untuk market IDN |

### 12.4 Dev Environment Setup (sketch)

Minimum tooling di developer machine:
- Go 1.22+ (`go version`)
- Node.js 20+ dengan `pnpm` atau `npm`
- Docker + Docker Compose
- `make` (Makefile jadi orchestrator: `make dev`, `make test`, `make lint`, `make migrate-up`)
- `golangci-lint`, `golang-migrate`, `air` (hot-reload backend)

Contoh `Makefile` snippet:
```makefile
.PHONY: dev test lint migrate-up migrate-down

dev:
	air -c .air.toml

test:
	go test -race -coverprofile=coverage.out ./...

lint:
	golangci-lint run ./...

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down 1
```

---

## 13. Development Phases

### 13.1 Phase 1 — MVP (3-4 bulan)

**Goal:** Usable HAZOP + basic BowTie auto-generation, deployable to single customer.

**Sprints (2-week cycle, total 8 sprints):**

| Sprint | Focus | Deliverable |
|---|---|---|
| 1 | Foundation | Go+Fiber bootstrap, Vite+React bootstrap, Auth, User mgmt, DB setup (GORM + migrations), CI/CD (GH Actions) |
| 2 | Project module | Project + Asset hierarchy CRUD (backend + frontend) |
| 3 | HAZOP part 1 | Node, Deviation, Cause, Consequence CRUD + domain services |
| 4 | HAZOP part 2 | Safeguard, Risk matrix, Worksheet UI (TanStack Table) |
| 5 | Library + Action | Library mgmt, Action tracking, Kanban (dnd-kit) |
| 6 | BowTie part 1 | Data model, auto-gen logic (domain service), basic render (React Flow) |
| 7 | BowTie part 2 | Edit canvas, export, sync logic, conflict resolution UI |
| 8 | Polish | Reporting (asynq + excelize/chromedp), Audit log, QA, bug fix |

**Exit criteria:**
- End-to-end flow: buat project → input HAZOP → generate BowTie → export report.
- 70% unit test coverage di backend (`go test -cover`).
- Basic smoke test di frontend (Vitest) + 1-2 critical E2E (Playwright).
- Deployed ke staging environment, ter-observasi via Sentry + Grafana.

### 13.2 Phase 2 — Enhancement (2-3 bulan)

- Real-time collaboration (WebSocket via Fiber + Redis pub/sub untuk multi-instance).
- Advanced BowTie (escalation factor, drag-drop refinement).
- LOPA module.
- Advanced reporting dashboard.
- Mobile responsive polish.
- OpenTelemetry integration (distributed tracing).

### 13.3 Phase 3 — Scale & Intelligence (3+ bulan)

- Multi-tenant SaaS productization.
- AI-assisted suggestion (cause, consequence, safeguard) — external LLM API call dari Go worker.
- Integration APIs (DMS, HSE systems).
- White-label support.
- Kubernetes deployment.

---

## 14. Risks, Assumptions, Out-of-Scope

### 14.1 Known Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Domain misinterpretation oleh dev team | High | High | Domain primer (Section 2), pair dengan SME, review tiap sprint |
| BowTie UI complexity (drag-drop-graph) | High | Medium | Pakai React Flow v12+, prototype early, jangan build from scratch |
| Tim kurang familiar Clean Architecture di Go | Medium | Medium | Bikin reference implementation di 1 modul (e.g., Project), lainnya ikutin pattern |
| Data migration dari existing tools | Medium | High | Build CSV import dari awal, scope Excel import sebagai Phase 2 |
| Performance pada project besar (>1000 deviations) | Medium | Medium | Virtualization di TanStack Table, pagination cursor-based, index strategy. Go lebih cepat dari Node jadi margin lebih aman. |
| Scope creep dari klien | High | High | SRS ini = baseline, change request = dokumentasi formal |
| Legal (similarity dengan PHA-Pro/BowTieXP) | Low | High | Jangan clone UI persis, bangun fitur dengan implementasi sendiri |

### 14.2 Assumptions

- Klien punya SME yang bisa di-konsultasi 1-2 jam/minggu selama development.
- Klien menyediakan sample data HAZOP real untuk testing.
- Initial deployment untuk 1 organisasi (multi-tenant bukan Phase 1 priority).
- User akses via browser modern (tidak perlu support IE).
- Tim punya minimal 1 orang senior Go developer untuk arsitektur.
- Data sensitif (intellectual property proyek) tetap terenkripsi di rest & in transit.

### 14.3 Out-of-Scope (Explicit)

- Mobile native app (iOS/Android).
- Real-time integration dengan DCS/SCADA.
- Physical modeling (dispersion, thermal radiation, explosion overpressure).
- Fully quantitative risk analysis (QRA).
- Integration dengan CAD/P&ID tools (AutoCAD, AVEVA).
- On-premise installer dengan support 24/7.
- Legally binding digital signature (hanya basic e-signature).

---

## 15. Glossary

| Term | Definition |
|---|---|
| **Barrier** | Kontrol keamanan yang mencegah atau mengurangi risiko, di BowTie |
| **BowTie** | Model visualisasi risiko berbentuk dasi kupu-kupu |
| **Cause** | Penyebab yang dapat memicu deviation |
| **Consequence** | Dampak yang mungkin terjadi akibat deviation |
| **Deviation** | Penyimpangan dari kondisi normal operasi |
| **Escalation Factor** | Kondisi yang dapat melemahkan barrier |
| **Fiber** | Web framework Go yang Express-like, pilihan utama untuk project ini |
| **GORM** | ORM untuk Go, dipakai sebagai default access layer |
| **Guide Word** | Kata panduan di HAZOP (No, More, Less, dll) |
| **HAZOP** | Hazard and Operability Study — metode analisis risiko sistematis |
| **LOPA** | Layer of Protection Analysis — metode semi-kuantitatif |
| **Likelihood** | Tingkat kemungkinan kejadian (1-5) |
| **Node** | Bagian proses yang dianalisis dalam HAZOP |
| **P&ID** | Piping and Instrumentation Diagram |
| **PHA** | Process Hazard Analysis — umbrella term untuk analisis bahaya proses |
| **Recommendation** | Rekomendasi perbaikan dari hasil HAZOP |
| **Risk Matrix** | Matriks 2D (Likelihood × Severity) untuk risk ranking |
| **Safeguard** | Kontrol yang sudah ada untuk mencegah atau mengurangi risiko |
| **Severity** | Tingkat keparahan dampak (1-5) |
| **sqlc** | Codegen tool untuk Go yang generate type-safe code dari SQL file |
| **Threat** | Terminologi BowTie untuk cause yang memicu top event |
| **Top Event** | Peristiwa kritis di pusat BowTie diagram |
| **Vite** | Build tool modern untuk frontend, dipakai untuk bundling React SPA |

---

## Appendix A: Mapping Logic Reference Implementation (Go)

Pseudo-code untuk core mapping logic di domain layer. File: `internal/domain/mapping/generator.go`.

```go
package mapping

import (
    "context"

    "github.com/google/uuid"
    "your-org/irms/internal/domain/bowtie"
    "your-org/irms/internal/domain/hazop"
)

// BowTieGenerator orchestrates the HAZOP → BowTie transformation.
// It depends on repository interfaces only (no DB / framework imports).
type BowTieGenerator struct {
    hazopRepo  hazop.Repository
    bowtieRepo bowtie.Repository
    grouper    TopEventGrouper // pluggable: semantic / manual / heuristic
}

func NewBowTieGenerator(hr hazop.Repository, br bowtie.Repository, g TopEventGrouper) *BowTieGenerator {
    return &BowTieGenerator{hazopRepo: hr, bowtieRepo: br, grouper: g}
}

// GenerateFromNode builds a BowTie diagram from all deviations under a node.
func (g *BowTieGenerator) GenerateFromNode(ctx context.Context, nodeID uuid.UUID) (*bowtie.Diagram, error) {
    deviations, err := g.hazopRepo.FindDeviationsByNode(ctx, nodeID)
    if err != nil {
        return nil, err
    }

    // Group deviations into semantic top events.
    groups := g.grouper.Group(deviations)

    diagram := bowtie.NewDiagram(nodeID)

    for _, group := range groups {
        topEvent := diagram.AddTopEvent(bowtie.TopEventInput{
            Label:              group.Label,
            SourceDeviationIDs: group.DeviationIDs(),
        })

        // ── Threats side ─────────────────────────────────────────
        uniqueCauses := dedupByID(group.Causes())
        for _, cause := range uniqueCauses {
            threat := diagram.AddThreat(bowtie.ThreatInput{
                Label:         cause.Description,
                SourceCauseID: cause.ID,
            })
            diagram.Connect(threat.ID, topEvent.ID, bowtie.ConnThreatToEvent)

            // Preventive barriers from safeguards on this cause.
            for _, sg := range cause.Safeguards {
                if !isPreventive(sg) {
                    continue
                }
                barrier := diagram.AddBarrier(bowtie.BarrierInput{
                    Type:              bowtie.BarrierPreventive,
                    Label:             sg.Description,
                    SourceSafeguardID: sg.ID,
                })
                diagram.InsertBarrierOn(threat.ID, topEvent.ID, barrier.ID)
            }
        }

        // ── Consequences side ────────────────────────────────────
        uniqueConseqs := dedupByID(group.Consequences())
        for _, c := range uniqueConseqs {
            conseq := diagram.AddConsequence(bowtie.ConsequenceInput{
                Label:              c.Description,
                SourceConsequenceID: c.ID,
            })
            diagram.Connect(topEvent.ID, conseq.ID, bowtie.ConnEventToConsequence)

            for _, sg := range c.Safeguards {
                if !isMitigative(sg) {
                    continue
                }
                barrier := diagram.AddBarrier(bowtie.BarrierInput{
                    Type:              bowtie.BarrierMitigative,
                    Label:             sg.Description,
                    SourceSafeguardID: sg.ID,
                })
                diagram.InsertBarrierOn(topEvent.ID, conseq.ID, barrier.ID)
            }
        }
    }

    diagram.AutoLayout() // deterministic positioning (dagre-like algorithm in Go)

    if err := g.bowtieRepo.Save(ctx, diagram); err != nil {
        return nil, err
    }
    return diagram, nil
}

// ── helpers ─────────────────────────────────────────────────────

func isPreventive(sg hazop.Safeguard) bool {
    return sg.Type == hazop.SafeguardPreventive || sg.Type == hazop.SafeguardBoth
}

func isMitigative(sg hazop.Safeguard) bool {
    return sg.Type == hazop.SafeguardMitigative || sg.Type == hazop.SafeguardBoth
}

// dedupByID keeps the first occurrence of each ID; generic across entity types
// that expose an ID() method (or pick concrete types — keep it simple).
func dedupByID[T interface{ GetID() uuid.UUID }](items []T) []T {
    seen := make(map[uuid.UUID]struct{}, len(items))
    out := make([]T, 0, len(items))
    for _, it := range items {
        if _, ok := seen[it.GetID()]; ok {
            continue
        }
        seen[it.GetID()] = struct{}{}
        out = append(out, it)
    }
    return out
}
```

**Testing pattern** — karena generator hanya depend ke interface `hazop.Repository` dan `bowtie.Repository`, unit test cukup pakai mock implementation tanpa DB:

```go
func TestBowTieGenerator_GenerateFromNode_DedupsCauses(t *testing.T) {
    hazopRepo := &mockHAZOPRepo{ /* preloaded deviations with duplicate causes */ }
    bowtieRepo := &mockBowTieRepo{}
    gen := mapping.NewBowTieGenerator(hazopRepo, bowtieRepo, mapping.NewSemanticGrouper())

    diagram, err := gen.GenerateFromNode(context.Background(), testNodeID)
    require.NoError(t, err)
    assert.Len(t, diagram.Threats(), 3, "duplicate causes should collapse to 3 unique threats")
}
```

---

## Appendix B: Sample HAZOP Data (untuk Testing & Seeding)

```json
{
  "node": {
    "name": "Reactor R-101 Feed Line",
    "description": "Line from pump P-101 to reactor R-101 inlet",
    "design_intent": "Deliver 100 m³/h of feedstock at 50°C, 5 barg"
  },
  "deviations": [
    {
      "parameter": "Flow",
      "guide_word": "No",
      "deviation": "No Flow",
      "causes": [
        {
          "description": "Pump P-101 trip due to power failure",
          "consequences": [
            {
              "description": "Reactor underfeed, potential runaway reaction",
              "severity_initial": 4,
              "likelihood_initial": 3,
              "safeguards": [
                {
                  "description": "Low-flow alarm FAL-101",
                  "type": "preventive",
                  "function": "detection"
                },
                {
                  "description": "Emergency shutdown on low-flow interlock",
                  "type": "mitigative",
                  "function": "emergency_response"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Di backend Go, file ini bisa di-load sebagai seed via `cmd/seed/main.go`:

```go
package main

import (
    "encoding/json"
    "log"
    "os"
    // ...
)

func main() {
    data, err := os.ReadFile("testdata/sample_hazop.json")
    if err != nil {
        log.Fatal(err)
    }
    var payload SeedPayload
    if err := json.Unmarshal(data, &payload); err != nil {
        log.Fatal(err)
    }
    // ... call seeder.Run(payload)
}
```

---

## Appendix C: Pre-Development Checklist

Sebelum mulai sprint 1, pastikan:

- [ ] Akses ke SME (Subject Matter Expert) process safety sudah scheduled.
- [ ] Sample data HAZOP real dari klien sudah diterima (dengan NDA jika perlu).
- [ ] Design system base sudah disepakati (warna, typography, spacing di Figma).
- [ ] Repository structure sudah di-bootstrap (2 repo: `irms-backend` Go, `irms-frontend` Vite/React — atau monorepo pakai pnpm workspace + Go multi-module).
- [ ] CI/CD pipeline dasar sudah jalan: backend (golangci-lint, go test, go build, trivy scan, gosec), frontend (eslint, vitest, vite build).
- [ ] Database ERD di-review dan di-approve oleh tech lead.
- [ ] Risk matrix template default sudah disiapkan (seed file JSON).
- [ ] Guide words set standar (IEC 61882) sudah di-seed di DB (migration + seed SQL).
- [ ] Local dev environment smoke test: `docker-compose up` → backend up di `:8080`, frontend up di `:5173`, hit `/healthz` return 200.

---

**End of SRS Document v1.1 (Go + Vite stack)**

> Dokumen ini adalah *living document*. Change request harus didokumentasikan di bagian Revision History dan di-approve oleh stakeholder yang relevan. Jangan edit langsung; pakai PR + review.

### Revision History

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | - | Initial draft (NestJS + Next.js) | - |
| 1.1 | 2026-04-22 | Rewrite stack ke Go (Fiber) + Vite.js + React. Update Section 5 (arsitektur), 9.4/9.6/9.7 (tooling), 12 (full stack), Appendix A (Go implementation). Domain logic, business rules, data model unchanged. | Rewrite |
