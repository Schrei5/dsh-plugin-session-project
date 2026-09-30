/**
 * Browser half of `dsh-plugin-session-project`.
 *
 * It writes one generated stylesheet that draws the owning Workspace's name
 * under every Session title, and only while the sidebar shows the flat session
 * list (视图选项 → 分组方式 → 单列表). Rows are addressed by their stable
 * `data-row-key="session:<id>"` attribute, so no React tree is touched and no
 * node is inserted: re-renders, drag reordering and the row animations keep
 * working unchanged.
 *
 * The shipped session row is a 32px flex row (slot, title, time, actions). The
 * generated rules keep that exact content box — `height:48px` with
 * `padding-bottom:16px` and `box-sizing:border-box` leaves the same 32px content
 * area, so the title, status dot, time and hover actions keep their positions —
 * and put the generated project line in the 16px strip underneath.
 */
window.__ModuleLoader__.load({
	id: "dsh-plugin-session-project",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/** Locale namespace owned by this plugin. */
		const NS = "sessionProjectLabel";
		/** Identity of the injected style element, mirroring plugin CSS tags. */
		const STYLE_KEY = "dsh-plugin-session-project/labels.css";
		/** Every Session row of the browsing region carries this key. */
		const ROW_PREFIX = '[data-row-key^="session:"]';
		/**
		 * A Workspace row (or its Show more/less button) exists only while the
		 * browser groups Sessions; their absence is what identifies 单列表.
		 */
		const GROUPED_SELECTOR = '[data-row-key^="workspace:"], [data-row-key^="overflow:"]';
		/** The automatic first-use Workspace title. */
		const DEFAULT_WORKSPACE_TITLE = "default-workspace";

		const zh = { ungrouped: "未分组" };
		const en = { ungrouped: "Ungrouped" };

		/**
		 * Reserve the second line and place the generated project name in it.
		 * `left` repeats the shipped title offset: 8px inline padding plus the
		 * Workspace-tree indent, the 16px leading cell, and the title's 4px margin.
		 */
		const BASE_CSS = [
			`${ROW_PREFIX}{box-sizing:border-box;height:48px;padding-bottom:16px;position:relative}`,
			`${ROW_PREFIX}::after{position:absolute;left:calc(28px + var(--dsh-workspace-indent,0px));right:8px;bottom:3px;font-size:12px;line-height:16px;font-weight:400;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}`,
			/* An archived row carries an accessible description and dims its title to the caption color. */
			`${ROW_PREFIX}[aria-description]::after{color:var(--dsw-alias-label-caption)}`
		].join("");

		/** Quote a CSS string value. */
		function cssString(value) {
			return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\n\r\f]/g, " ")}"`;
		}

		/** Escape a value used inside a CSS attribute selector. */
		function cssAttribute(value) {
			return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\n\r\f]/g, " ");
		}

		/** Leaf directory name of a Workspace path. */
		function pathLeaf(path) {
			if (typeof path !== "string") return "";
			const parts = path.replace(/[\\/]+$/, "").split(/[\\/]/);
			return parts[parts.length - 1] ?? "";
		}

		/**
		 * The project name one Workspace reads as: its own title, the localized
		 * default name while it still carries the automatic first-use title, and
		 * the folder leaf if that dictionary is missing.
		 * @param workspace - Workspace projection from the controller snapshot.
		 * @param locale - client locale service.
		 * @returns the name to print under this Workspace's Session titles.
		 */
		function projectName(workspace, locale) {
			const title = typeof workspace.title === "string" ? workspace.title.trim() : "";
			if (title !== "" && title !== DEFAULT_WORKSPACE_TITLE) return title;
			const localized = locale.translate("common", "workspace.defaultName");
			if (typeof localized === "string" && localized !== "" && localized !== "workspace.defaultName") return localized;
			const leaf = pathLeaf(workspace.path);
			return leaf !== "" ? leaf : DEFAULT_WORKSPACE_TITLE;
		}

		/**
		 * Draw the project line under every listed Session title.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			const sessions = ctx.get("sessions");
			const workspaces = ctx.get("workspaces");
			const locale = ctx.get("locale");
			ctx.effect(() => locale.register(NS, { zh, en }), "session-project-label: dictionaries");

			const doc = document;
			let style = doc.querySelector(`style[data-plugin-css="${STYLE_KEY}"]`);
			if (style === null) {
				style = doc.createElement("style");
				style.dataset.plugin = "dsh-plugin-session-project";
				style.dataset.pluginCss = STYLE_KEY;
				doc.head.appendChild(style);
			}

			let lastCss = null;
			let timer = 0;

			/** The flat session list renders no Workspace rows and no overflow button. */
			const flatList = () => doc.querySelector(GROUPED_SELECTOR) === null;

			/** The complete stylesheet for the current projection. */
			const build = () => {
				if (!flatList()) return "";
				const items = workspaces.list.getSnapshot()?.items ?? [];
				const owner = new Map();
				for (const workspace of items) {
					const name = projectName(workspace, locale);
					for (const id of workspace.sessionIds ?? []) owner.set(String(id), name);
				}
				const ungrouped = locale.translate(NS, "ungrouped");
				let rules = "";
				for (const id of sessions.list.getSnapshot()?.ids ?? []) {
					const name = owner.get(String(id)) ?? ungrouped;
					rules += `[data-row-key="session:${cssAttribute(id)}"]::after{content:${cssString(name)}}`;
				}
				return rules === "" ? "" : BASE_CSS + rules;
			};

			const render = () => {
				try {
					const css = build();
					if (css === lastCss) return;
					lastCss = css;
					style.textContent = css;
				} catch (error) {
					console.warn("session-project-label: render failed", error);
				}
			};

			const schedule = () => {
				if (timer !== 0) return;
				timer = setTimeout(() => {
					timer = 0;
					render();
				}, 0);
			};

			const stops = [
				sessions.list.subscribe(schedule),
				workspaces.list.subscribe(schedule),
				ctx.on("locale/change", schedule)
			];
			const observer = new MutationObserver(schedule);
			observer.observe(doc.body, { childList: true, subtree: true });

			ctx.effect(() => () => {
				observer.disconnect();
				if (timer !== 0) clearTimeout(timer);
				for (const stop of stops) stop?.();
				style?.remove();
			}, "session-project-label: flat-list labels");

			render();
		}

		exports.name = "dsh-plugin-session-project";
		exports.inject = ["sessions", "workspaces", "locale"];
		exports.apply = apply;
		return module.exports;
	}
});
