/**
 * Host half of `dsh-plugin-session-project`.
 *
 * The whole feature lives in the browser half (`./client`), which draws the
 * owning Workspace's name under every Session title while the sidebar shows the
 * flat session list (视图选项 → 分组方式 → 单列表). This half only has to exist:
 * the Loader mounts it, and `dsh-client-modules` reads this package's
 * `dsh.client` declaration from the same manifest to publish the browser row.
 */

/** Plugin name reported to the Loader. */
export const name = "dsh-plugin-session-project";

/** No host services are needed. */
export const inject = [];

/** Host-side behavior: none. */
export function apply() {}
