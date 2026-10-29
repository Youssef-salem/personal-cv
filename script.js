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

const repositoryList = document.getElementById("repository-list");
const repositoryStatus = document.getElementById("repository-status");
const refreshRepositories = document.getElementById("refresh-repositories");
const githubUser = "Youssef-salem";
const repositoryLimit = 6;
const repositoriesUrl = `https://api.github.com/users/${githubUser}/repos?sort=updated&direction=desc&per_page=${repositoryLimit}&type=owner`;

function isRepository(repository) {
  return repository !== null && typeof repository === "object" &&
    typeof repository.name === "string" && /^[\w.-]+$/.test(repository.name) &&
    repository.name !== "." && repository.name !== ".." &&
    (repository.description === null || typeof repository.description === "string") &&
    (repository.language === null || typeof repository.language === "string") &&
    Number.isSafeInteger(repository.stargazers_count) && repository.stargazers_count >= 0;
}

function createRepositoryCard(repository) {
  const card = document.createElement("article");
  card.className = "project-card";
  const heading = document.createElement("h3");
  const link = document.createElement("a");
  // Treat API content as text and build links on a trusted, fixed origin.
  link.textContent = repository.name;
  link.href = `https://github.com/${githubUser}/${encodeURIComponent(repository.name)}`;
  heading.append(link);
  const description = document.createElement("p");
  description.textContent = repository.description || "No description provided on GitHub.";
  const metadata = document.createElement("ul");
  metadata.className = "chips";
  metadata.setAttribute("aria-label", "Repository details");
  const language = document.createElement("li");
  language.textContent = `Language: ${repository.language || "Not specified"}`;
  const stars = document.createElement("li");
  stars.textContent = `Stars: ${repository.stargazers_count.toLocaleString()}`;
  metadata.append(language, stars);
  card.append(heading, description, metadata);
  return card;
}

async function loadRepositories() {
  if (refreshRepositories.disabled) return;
  refreshRepositories.disabled = true;
  refreshRepositories.textContent = "Loading...";
  repositoryList.setAttribute("aria-busy", "true");
  repositoryList.replaceChildren();
  repositoryStatus.dataset.state = "loading";
  repositoryStatus.textContent = "Loading public repositories from GitHub...";

  // Bound the wait so a stalled connection still offers a usable retry action.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(repositoriesUrl, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal
    });
    if (!response.ok) {
      if (response.status === 429 ||
          (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")) {
        throw new Error("GitHub's request limit has been reached. Please wait and try again later.");
      }
      throw new Error(`GitHub returned HTTP ${response.status}. Please try again later.`);
    }
    const repositories = await response.json();
    if (!Array.isArray(repositories) || !repositories.every(isRepository)) {
      throw new Error("GitHub returned unexpected repository data. Please try again later.");
    }
    const visibleRepositories = repositories.slice(0, repositoryLimit);
    const cards = visibleRepositories.map(createRepositoryCard);
    repositoryList.replaceChildren(...cards);
    repositoryStatus.dataset.state = "success";
    repositoryStatus.textContent = cards.length
      ? `Loaded ${cards.length} ${cards.length === 1 ? "repository" : "repositories"} from GitHub, ordered by latest update.`
      : "No public repositories are available on GitHub yet.";
  } catch (error) {
    console.error("Unable to load GitHub repositories:", error);
    repositoryStatus.dataset.state = "error";
    if (controller.signal.aborted) {
      repositoryStatus.textContent = "GitHub took too long to respond. Please try again.";
    } else if (error instanceof TypeError) {
      repositoryStatus.textContent = "Unable to reach GitHub. Check your connection and try again.";
    } else if (error instanceof SyntaxError) {
      repositoryStatus.textContent = "GitHub returned unreadable data. Please try again later.";
    } else {
      repositoryStatus.textContent = error instanceof Error
        ? error.message
        : "Unable to load repositories. Please try again later.";
    }
  } finally {
    clearTimeout(timeout);
    repositoryList.setAttribute("aria-busy", "false");
    refreshRepositories.disabled = false;
    refreshRepositories.textContent = repositoryStatus.dataset.state === "error"
      ? "Retry loading repositories"
      : "Refresh repositories";
  }
}

refreshRepositories.hidden = false;
refreshRepositories.addEventListener("click", loadRepositories);
loadRepositories();
