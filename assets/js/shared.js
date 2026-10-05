window.Signal = (() => {
  'use strict';
  function notify(message) {
    let toast = document.querySelector("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.hidden = true;
    }, 4500);
  }
  const escapeHTML = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
          char
        ],
    );
  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem("signal-demo-session"));
      return session && typeof session.name === "string" ? session : null;
    } catch {
      return null;
    }
  }
  function beginDemo(name = "Автор") {
    try {
      sessionStorage.setItem(
        "signal-demo-session",
        JSON.stringify({ name, demo: true }),
      );
      return true;
    } catch {
      return false;
    }
  }

  return { notify, escapeHTML, getSession, beginDemo };
})();
