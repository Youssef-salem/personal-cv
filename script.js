"use strict";

// Start with the system theme; the button overrides it for this page visit.
const themeButton = document.getElementById("theme-toggle");
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
let themeOverridden = false;

function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeButton.setAttribute("aria-pressed", String(dark));
}

setTheme(systemTheme.matches);
themeButton.hidden = false;
themeButton.addEventListener("click", () => {
  themeOverridden = true;
  setTheme(document.documentElement.dataset.theme !== "dark");
});
systemTheme.addEventListener("change", (event) => {
  if (!themeOverridden) setTheme(event.matches);
});

// Keep the original CV readable without JavaScript; enable disclosures here.
document.querySelectorAll("[data-disclosure]").forEach((button) => {
  const content = document.getElementById(button.getAttribute("aria-controls"));

  function setExpanded(expanded) {
    content.hidden = !expanded;
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = `${expanded ? "Hide" : "Show"} ${button.dataset.disclosure}`;
  }

  setExpanded(!button.hasAttribute("data-collapse-on-load"));
  button.hidden = false;
  button.addEventListener("click", () => setExpanded(content.hidden));
});

const form = document.getElementById("contact-form");
const nameInput = document.getElementById("contact-name");
const emailInput = document.getElementById("contact-email");
const messageInput = document.getElementById("contact-message");
const status = document.getElementById("form-status");
const draftLink = document.getElementById("email-draft");
const fields = [nameInput, emailInput, messageInput];
let validationAttempted = false;

function validateField(field) {
  const value = field.value.trim();
  let error = "";
  if (!value) {
    error = `Please enter your ${field.name}.`;
  } else if (field === emailInput && (
    field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  )) {
    error = "Enter a valid email address, such as name@example.com.";
  } else if (value.length > field.maxLength) {
    error = `Use no more than ${field.maxLength} characters.`;
  }
  document.getElementById(`${field.name}-error`).textContent = error;
  field.setAttribute("aria-invalid", String(Boolean(error)));
  return !error;
}

// Disable native bubbles only after our inline validation handlers are available.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  validationAttempted = true;
  draftLink.hidden = true;
  draftLink.removeAttribute("href");
  const invalidFields = fields.filter((field) => !validateField(field));
  if (invalidFields.length) {
    status.dataset.state = "error";
    status.textContent = "Please correct the highlighted fields. Your message has not been sent.";
    invalidFields[0].focus();
    return;
  }

  // A mailto link prepares a draft, not a delivery confirmation.
  const subject = `CV enquiry from ${nameInput.value.trim()}`;
  const body = `Name: ${nameInput.value.trim()}\nEmail: ${emailInput.value.trim()}\n\n${messageInput.value.trim()}`;
  draftLink.href = `mailto:business.youssefsalem@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  draftLink.hidden = false;
  status.dataset.state = "success";
  status.textContent = "Your message passed validation. Nothing has been sent. Use Open email draft to review and send it in your email app.";
});

form.addEventListener("input", (event) => {
  // Discard a stale draft as soon as any input changes.
  draftLink.hidden = true;
  draftLink.removeAttribute("href");
  status.textContent = "";
  delete status.dataset.state;
  if (validationAttempted && fields.includes(event.target)) validateField(event.target);
});
form.noValidate = true;
form.hidden = false;
