# Discussions 帖（可直接粘贴）

发帖入口：https://github.com/deepseek-ai/deepseek-harness/discussions/new/choose
（分类建议选 **Ideas** 或 **Show and tell**，看你那边实际有哪些分类；正文英文，维护者看得更直接）

---

**Title**

`[Plugin] Show each session's project name under the title in the flat session list`

**Body**

Sharing a small community plugin, plus one suggestion for the shipped sidebar.

**Plugin:** https://github.com/Schrei5/dsh-plugin-session-project (topic `dsh-plugin`)

```bash
dsh plugin --profile <profile> add github:Schrei5/dsh-plugin-session-project
```

Then enable the bundle on the Plugins page. It is a normal DSH bundle plus a `dsh.client` half, so it works with the existing plugin management.

**What it does:** in the flat session list (View options → Group by → In one list / 单列表) every row renders the name of the Workspace that owns it under the session title. Grouped views are untouched, since their section header already names the Workspace. Only that list changes: its rows go from 32px to 48px (the content line stays 32px, the label takes the 16px below it).

**Why:** the flat list is the only browsing mode that renders no Workspace header, so sessions from different projects look alike there — the title alone carries no project context. The fact itself already exists in the Client: search results render a `workspace` meta line under their title, and a session hover card names the working directory.

**Suggestion for the shipped UI:** the same two lines could be first-class in `packages/client/ui-workspace`. I prototyped it against 0.2.0-rc.2 as a one-package diff:

- `SessionNode` carries `workspace?: string`; `deriveFlat` fills it from the owning Workspace, the working directory leaf, or the empty value the renderer shows as the localized `group.ungrouped` label, and shares the Workspace-to-Session projection with `deriveSearchResults`;
- the row stacks a 32px content line (unchanged geometry for the status slot, title, time and hover actions) plus the 16px label, so grouped rows keep their current height;
- no new locale copy and no new exports.

The open design questions are the ones a maintainer should settle: should the flat list show the project by default, or behind a View options toggle like grouping and ordering? And is the 32px → 48px density in the flat list acceptable?

Screenshots and the full behaviour notes: https://github.com/Schrei5/dsh-plugin-session-project

---

## 备注（不发出去）

- 为什么不用 PR：`CONTRIBUTING.md` 明确写了当前不接受外部 PR，仓库也关了 Issues（只有 Discussions）。
- 帖子里没有贴完整 patch；如果维护者想看细节，可以再把 `~/dsh-upstream/session-workspace-label.patch` 贴上去或另开一个帖子。
