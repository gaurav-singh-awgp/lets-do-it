# User guide — lets-do-it

**lets-do-it** is a simple **personal todo list** in the browser: add tasks, mark them complete, and delete them. **Version 1 has no sign-in**; everyone who uses the same server address shares one list (suitable for local development or a single trusted deployment).

---

## Getting the app open

How you open the app depends on how it was started:

| How it runs | Typical URL | Notes |
|-------------|-------------|--------|
| **Local dev** (Vite + API on your machine) | **`http://127.0.0.1:5173`** | Start Postgres, API, and web per the root [**README**](../README.md) **Run** section. |
| **Docker Compose** (full profile) | **`http://127.0.0.1:9080`** | Static web UI; API is on another host port (**`3000`** by default). See README. |

If nothing loads, confirm Postgres is up, the API is running, and you are using the URL your administrator documented.

---

## What you see when the page loads

1. **Loading** — Brief loading placeholders appear while your todos are fetched from the server.
2. **Then one of:**
   - **Empty state** — Message such as “No todos yet” with a hint to add your first task **above** the input.
   - **Your list** — Newest tasks at the **top** (most recently created first).

---

## Adding a todo

1. Find the text field (placeholder: **“What needs doing?”**).
2. Type a short description of the task.
3. Press **Enter** or click **Add**.

**Rules:**

- **Empty or whitespace-only** text is not allowed. You will see a short validation message; fix the text and try again.
- **Length:** text may be up to **500 Unicode code points** per task (see PRD FR-02). If you go over the limit, a message explains the cap.

While the app is saving a new todo, the field and **Add** may be disabled and a status such as **“Adding…”** appears.

---

## Marking a task done (or not done)

Each row has a **checkbox** on the left:

- Check it to mark the task **done** (strikethrough / muted styling).
- Uncheck to mark it **active** again.

The app saves the change to the server. If a toggle fails, an error message appears; try again after the server is reachable.

---

## Deleting a task

Each row has a **Delete** button (visible text, not icon-only). Click **Delete** to remove that task permanently. When you delete the **last** task, the **empty state** returns.

---

## If something goes wrong

### List failed to load

You may see a banner at the top with a short explanation and a **Retry** button. **Retry** runs the load again (for example after you fix the network or start the API).

Repeated failures use the same friendly message when the server does not return a specific error text.

### Could not add a todo

If the server rejects the request, feedback appears near the composer. You can **Retry** the last add when the button is available.

### Toggle or delete failed

A compact error area may appear above the list. Fix connectivity or server issues, then try the action again.

---

## Keyboard and assistive technology

- **Tab** order moves through the add field, **Add**, then the list (checkboxes and **Delete** buttons in order).
- **Space** on a checkbox toggles done, when the control is focused.
- **Enter** in the add field submits the form (same as **Add**).
- Focus rings are visible for keyboard users.

---

## Privacy and data

- There is **no user account** in V1: todos live in the **server database** tied to that deployment.
- Do not put secrets or highly sensitive personal data into todos on a shared or untrusted server.

For operators (database backups, HTTPS, secrets), see the **[Developer guide](DEVELOPER_GUIDE.md)** and root **README**.
