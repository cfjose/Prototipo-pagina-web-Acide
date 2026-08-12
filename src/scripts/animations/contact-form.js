/*
  No hay backend/servicio de mail conectado todavía — el submit se
  previene y solo muestra un mensaje de confirmación en pantalla, para
  que el formulario se sienta funcional en la demo sin mandar nada a
  ningún lado. Conectar acá cuando haya un endpoint real.
*/
export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const success = form.querySelector("[data-contact-form-success]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    success?.classList.remove("hidden");
    form.reset();
  });
}
