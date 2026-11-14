/**
 * Chat layout (spec 4.5): day separators, sender groups and message state. Pure logic.
 *   layoutMessages(messages, { me, now, pendingKeys, failedKeys }) -> Array<day | msg> items
 * Depends on: formatDaySeparator, formatLocalDate.
 */
(function (root) {
  "use strict";

  const GROUP_WINDOW_MS = 5 * 60 * 1000;

  function messageState(msg, pendingKeys, failedKeys) {
    const key = "chat:" + msg.id;
    if (failedKeys.has(key)) return "failed";
    if (pendingKeys.has(key)) return "sending";
    return "sent";
  }

  function sameGroup(prev, next) {
    if (!prev || prev.sender !== next.sender) return false;
    const gap = new Date(next.timestamp).getTime() - new Date(prev.timestamp).getTime();
    return gap >= 0 && gap <= GROUP_WINDOW_MS && root.formatLocalDate(new Date(prev.timestamp)) === root.formatLocalDate(new Date(next.timestamp));
  }

  /**
   * @param {Array<object>} messages ordered oldest first
   * @param {{me: string, now: Date, pendingKeys: Set<string>, failedKeys: Set<string>}} ctx
   */
  function layoutMessages(messages, ctx) {
    const items = [];
    let lastDay = "";
    let prev = null;
    messages.forEach((msg, index) => {
      const when = msg.timestamp ? new Date(msg.timestamp) : null;
      const day = when ? root.formatLocalDate(when) : "";
      if (day && day !== lastDay) {
        items.push({ kind: "day", label: root.formatDaySeparator(when, ctx.now) });
        lastDay = day;
        prev = null;
      }
      const next = messages[index + 1];
      const groupStart = !sameGroup(prev, msg);
      const groupEnd = !(next && sameGroup(msg, next));
      items.push({
        kind: "msg", msg: msg, own: msg.sender === ctx.me, groupStart: groupStart, groupEnd: groupEnd,
        showTime: groupEnd, state: messageState(msg, ctx.pendingKeys, ctx.failedKeys)
      });
      prev = msg;
    });
    return items;
  }

  root.layoutMessages = layoutMessages;
})(typeof window !== "undefined" ? window : this);
