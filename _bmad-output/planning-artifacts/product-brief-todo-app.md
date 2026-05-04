# Product Brief: Lets-do-it (Personal Todo)

## Executive Summary

**Lets-do-it** is a deliberately minimal **full-stack personal todo** product: one user, one list, clear actions—add, see, complete, remove—without accounts, tutorials, or feature noise. The problem it solves is not “lack of todo apps in the world,” but **friction and cognitive load**: many tools overload new users with configuration, collaboration, and premium upsells before a single task is captured. This product optimizes for **immediate clarity**, **reliable persistence**, and a **responsive** experience on phone and desktop so a solo user can trust the app as a lightweight extension of their attention.

The first release proves that a **small, well-bounded** product can still feel *finished*: polished empty and error states, visible distinction between done and active work, and an API small enough that future contributors can extend it—especially toward **authentication and multi-user** support later—without rewriting the core model.

## The Problem

- **Attention fragmentation:** People delay capturing tasks when the capture surface is slow, cluttered, or requires setup (sign-in, workspace creation, template picks).
- **Trust gaps:** Simple browser-side or demo lists lose data on refresh or device change; users abandon tools that feel “toy” or fragile.
- **Scope creep by vendor:** Tools that started simple often push prioritization, calendars, and notifications; users who only want a list feel mismatched.

**Who feels it:** Individual contributors, students, and professionals who want a **private scratch list** for the day or week—not a program-management suite.

**Cost of status quo:** Tasks stay in chat threads, sticky notes, or mental RAM; completion is unclear; context switching rises.

## The Solution

A **web application** backed by a **small HTTP API** and a **durable store**. The user opens the app and **immediately sees** their todos (or a purposeful empty state). They add a short description; each item carries **completion state** and **creation timestamp** metadata. Completing or deleting updates the UI **without full-page reloads** in normal operation, and state **survives refresh and return visits**.

The experience is tuned for **readability** (active vs completed), **touch and narrow viewports**, and **graceful degradation** when the network or server misbehaves—errors surface clearly without trapping the user.

## What Makes This Different

- **Radical simplicity as the spec:** V1 explicitly excludes accounts, sharing, priorities, due dates, and notifications so design and engineering focus on core loop quality.
- **Extension-ready architecture without shipping complexity:** Data model and API boundaries avoid painting the product into a “single-device demo only” corner.
- **Honest positioning:** Differentiation is **execution on basics** (speed, clarity, reliability), not proprietary algorithms.

## Who This Serves

| Segment | Needs | Success for them |
|--------|--------|------------------|
| **Primary: solo knowledge workers** | Fast capture, glanceable status, mobile + desktop | Complete daily capture→act→clear loop without documentation |
| **Secondary: builders evaluating the repo** | Readable codebase, obvious API, simple deploy story | Extend or fork without archeology |

## Success Criteria

| Signal | Target |
|--------|--------|
| **Unaided task completion** | New user completes add → complete → delete **without in-app instructions** in first session |
| **Persistence trust** | After hard refresh, **100%** of items from prior session reappear (when server healthy) |
| **Perceived responsiveness** | Core actions (add/complete/delete) reflect in UI **≤ 1 s P95** under normal local/dev-class conditions; API **≤ 200 ms P95** for CRUD on small lists (≤ 500 items) |
| **Quality bar** | Empty, loading, and error states exist for main views; no blank failures |
| **Scope discipline** | Production V1 ships **without** auth, multi-user, priorities, deadlines, notifications |

## Scope

**In V1**

- CRUD API for todos (fields: text, done flag, created-at; server assigns stable ids).
- Client list view with create, toggle complete, delete.
- Responsive layout; accessible semantics baseline (headings, buttons, focus).
- Client and server error handling paths that preserve user orientation.

**Out of V1 (explicit)**

- User accounts, roles, sharing/collaboration.
- Priorities, sections/projects, tags, search (beyond trivial if added later).
- Due dates, reminders, push/email/in-app notifications.
- Native mobile apps (web-first).

## Vision

If the core lands well, **V2** can add **identity** (optional accounts), **multi-device sync** with conflict rules, and **lightweight organization** (e.g., one level of grouping)—each gated on clear user demand. Longer term, the product could remain a **reference-quality minimal app** used for teaching full-stack patterns, or grow into a small paid hosted service. Either path keeps the **same north star:** respect user attention and data durability over feature count.

---

**Related artifact:** [Product Requirements Document](./prd.md) (formal requirements and traceability).
