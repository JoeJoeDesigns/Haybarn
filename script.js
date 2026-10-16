/* Haybarn Beer Co. site interactions.
   IMPORTANT: Configure the Supabase and signup provider settings below before launch.
   Do not put private/service-role keys in this file. */
(() => {
  "use strict";

  // Public browser credentials only. Supabase anon/publishable key is designed for client use,
  // but database Row Level Security (RLS) must be enabled and tested.
  const CONFIG = {
    supabaseUrl: "",       // e.g. https://YOUR_PROJECT.supabase.co
    supabaseAnonKey: "",   // Supabase publishable/anon key; NEVER use service_role here
    signupFormEndpoint: "" // Optional Formspree endpoint, e.g. https://formspree.io/f/xxxxabcd
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Mobile navigation
  const navToggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    $$("a", nav).forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }));
  }

  // Current year in footer
  $$("[data-year]").forEach(node => node.textContent = new Date().getFullYear());

  // Rating hint
  const ratingHint = $("#rating-hint");
  const ratingLabels = {1:"Not for me",2:"Could be better",3:"It's alright",4:"Really enjoyed it",5:"Loved it"};
  $$('input[name="rating"]').forEach(input => input.addEventListener("change", () => {
    if (ratingHint) ratingHint.textContent = `${input.value} out of 5 — ${ratingLabels[input.value]}`;
  }));

  function setStatus(node, message, kind = "") {
    if (!node) return;
    node.textContent = message;
    node.className = `form-status ${kind}`.trim();
  }

  // Submit tasting feedback to Supabase when configured. Until configured, submissions are
  // intentionally not reported as saved; this avoids silently losing customer feedback.
  const feedbackForm = $("#feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async event => {
      event.preventDefault();
      const status = $("#feedback-status");
      const submit = $('button[type="submit"]', feedbackForm);
      if (!feedbackForm.reportValidity()) return;

      if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) {
        setStatus(status, "Feedback form preview only — submissions are not being saved yet. The owner needs to connect the secure feedback database before launch.", "error");
        return;
      }

      const data = new FormData(feedbackForm);
      const payload = {
        beer: data.get("beer"),
        rating: Number(data.get("rating")),
        comments: (data.get("comments") || "").trim() || null,
        would_order: data.get("would_order") || null,
        public_ok: data.get("public_ok") === "yes",
        first_name: (data.get("first_name") || "").trim() || null,
        email: (data.get("email") || "").trim() || null
      };

      submit.disabled = true;
      submit.textContent = "Sending…";
      try {
        const response = await fetch(`${CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/tasting_feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": CONFIG.supabaseAnonKey,
            "Authorization": `Bearer ${CONFIG.supabaseAnonKey}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Feedback service returned ${response.status}`);
        feedbackForm.reset();
        if (ratingHint) ratingHint.textContent = "Tap a star to rate";
        setStatus(status, "Thanks for helping shape Haybarn. Your feedback has been received.", "success");
      } catch (error) {
        console.error("Feedback submission failed:", error);
        setStatus(status, "We couldn't send that just now. Please try again in a moment.", "error");
      } finally {
        submit.disabled = false;
        submit.innerHTML = 'Send my feedback <span aria-hidden="true">↗</span>';
      }
    });
  }

  // Newsletter / opening announcement signup. Requires a configured form endpoint.
  const signupForm = $("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async event => {
      event.preventDefault();
      const status = $("#signup-status");
      const submit = $('button[type="submit"]', signupForm);
      if (!signupForm.reportValidity()) return;

      if (!CONFIG.signupFormEndpoint) {
        setStatus(status, "Signup preview only — email collection is not connected yet. Connect an email signup service before publishing.", "error");
        return;
      }

      const data = new FormData(signupForm);
      const payload = {
        first_name: data.get("first_name") || "",
        email: data.get("email"),
        consent: data.get("consent") === "on",
        source: "Haybarn Beer Co. website opening updates"
      };
      submit.disabled = true;
      submit.textContent = "Submitting…";
      try {
        const response = await fetch(CONFIG.signupFormEndpoint, {
          method: "POST",
          headers: {"Accept": "application/json", "Content-Type": "application/json"},
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Signup service returned ${response.status}`);
        signupForm.reset();
        setStatus(status, "You're on the list. Thanks for following Haybarn!", "success");
      } catch (error) {
        console.error("Signup submission failed:", error);
        setStatus(status, "We couldn't complete your signup. Please try again in a moment.", "error");
      } finally {
        submit.disabled = false;
        submit.innerHTML = 'Keep me posted <span aria-hidden="true">↗</span>';
      }
    });
  }

  // Placeholder social links must not send visitors to an empty page.
  $$(".placeholder-link").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    window.alert("Haybarn's official social profile will be linked here once confirmed.");
  }));
})();