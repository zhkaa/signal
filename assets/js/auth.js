(() => {
  'use strict';
  const { beginDemo, notify } = window.Signal;
  const form = document.querySelector("#auth-form");
  const password = document.querySelector("#password");
  document
    .querySelector(".password-toggle")
    .addEventListener("click", (event) => {
      const visible = password.type === "password";
      password.type = visible ? "text" : "password";
      event.currentTarget.setAttribute(
        "aria-label",
        visible ? "Скрыть пароль" : "Показать пароль",
      );
      event.currentTarget.setAttribute("aria-pressed", String(visible));
    });
  document
    .querySelector("#forgot-password")
    ?.addEventListener("click", () =>
      notify(
        "В демо пароль не проверяется. Введите любые 8 символов. Восстановление появится с настоящими аккаунтами.",
      ),
    );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = document.querySelector("#auth-error");
    const name =
      form.dataset.mode === "register"
        ? form.elements.namedItem("name").value.trim()
        : "Автор";
    if (
      !form.elements.email.value.trim() ||
      (form.dataset.mode === "register" && name.length < 2)
    ) {
      error.textContent =
        "Заполните поля: имя и логин не должны состоять из пробелов.";
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const stored = beginDemo(name);
    form.reset();
    location.assign(location.protocol === "file:" || !stored ? "app.html?demo=1" : "app.html");
  });

})();
