---
description: Master build workflow for PIXLAYER SaaS — AI image layering platform
---

# PIXLAYER Master Build Workflow

// turbo-all

## Skill References
Before each phase, read the relevant skill files for patterns and conventions.

| Domain | Skill Path |
|--------|-----------|
| Frontend | `.agent/skills/frontend-react/SKILL.md` |
| Backend | `.agent/skills/backend-express/SKILL.md` |
| Design System | `.agent/skills/design-system/SKILL.md` |
| Canvas | `.agent/skills/canvas-rendering/SKILL.md` |
| State Management | `.agent/skills/state-management/SKILL.md` |
| AI/ML | `.agent/skills/ai-ml-integration/SKILL.md` |
| Export Engine | `.agent/skills/export-engine/SKILL.md` |
| Auth & Billing | `.agent/skills/auth-billing/SKILL.md` |
| Security | `.agent/skills/security/SKILL.md` |
| Performance | `.agent/skills/performance/SKILL.md` |
| Infrastructure | `.agent/skills/infrastructure/SKILL.md` |
| Testing | `.agent/skills/testing-qa/SKILL.md` |
| Debug | `.agent/skills/debug/SKILL.md` |
| Code Quality | `.agent/skills/code-quality/SKILL.md` |

---

## Phase 1 — Project Scaffold & Core UI Shell
**Workflow:** `.agent/workflows/phase1-scaffold.md`
**Skills:** frontend-react, backend-express, design-system, canvas-rendering, state-management, code-quality

---

## Phase 2 — Image Upload & SAM 2 Segmentation
**Workflow:** `.agent/workflows/phase2-segmentation.md`
**Skills:** ai-ml-integration, canvas-rendering, state-management, performance

---

## Phase 3 — Text Segmentation & Inpainting
**Workflow:** `.agent/workflows/phase3-text-inpainting.md`
**Skills:** ai-ml-integration, backend-express, security, auth-billing

---

## Phase 4 — Multi-Format Export Engine
**Workflow:** `.agent/workflows/phase4-export.md`
**Skills:** export-engine, canvas-rendering, performance

---

## Phase 5 — Auth, Dashboard & Billing
**Workflow:** `.agent/workflows/phase5-auth-billing.md`
**Skills:** auth-billing, security, backend-express, frontend-react

---

## Phase 6 — Performance, Polish & Production
**Workflow:** `.agent/workflows/phase6-polish.md`
**Skills:** performance, infrastructure, security, debug, testing-qa

---

## Subagent Coordination
**Reference:** `.agent/subagents.md`

After each phase, run the verification subagent tasks defined in the subagents doc to confirm visual and functional correctness via browser testing.
