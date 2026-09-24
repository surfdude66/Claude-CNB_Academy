(function () {
  "use strict";

  var IMG_BASE = "https://images.unsplash.com/photo-";
  var IMG_PARAMS = "?auto=format&fit=crop&w=900&q=70";

  var grid = document.getElementById("course-grid");
  var template = document.getElementById("card-template");
  var resultCount = document.getElementById("result-count");
  var noResults = document.getElementById("no-results");
  var searchInput = document.getElementById("course-search");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));

  var courses = [];
  var activeFilter = "All";

  function formatFee(fee) {
    return "S$" + Number(fee).toLocaleString("en-SG");
  }

  function formatWeeks(weeks) {
    return weeks + (weeks === 1 ? " week" : " weeks");
  }

  function courseImageUrl(course) {
    return IMG_BASE + course.img + IMG_PARAMS;
  }

  function renderCard(course) {
    var node = template.content.cloneNode(true);
    var photo = node.querySelector(".course-photo");
    photo.src = courseImageUrl(course);
    photo.alt = course.title + " — " + course.cat + " course photo";

    node.querySelector(".course-code").textContent = course.code;
    node.querySelector(".course-level").textContent = course.level;
    node.querySelector(".course-campus").textContent = course.campus;
    node.querySelector(".course-title").textContent = course.title;
    node.querySelector(".course-summary").textContent = course.summary;
    node.querySelector(".course-weeks").textContent = formatWeeks(course.weeks);
    node.querySelector(".course-schedule").textContent = course.when;
    node.querySelector(".course-fee").textContent = formatFee(course.fee);

    var article = node.querySelector(".course-card");
    article.id = "course-" + course.code;
    article.tabIndex = 0;

    node.querySelector(".course-signup-btn").addEventListener("click", function () {
      openSignup(course);
    });

    return node;
  }

  function matchesSearch(course, query) {
    if (!query) return true;
    var haystack = [course.title, course.summary, course.code, course.campus, course.cat]
      .join(" ")
      .toLowerCase();
    return haystack.indexOf(query.toLowerCase()) !== -1;
  }

  function applyFilters() {
    var query = searchInput.value.trim();
    var visible = courses.filter(function (c) {
      var categoryOk = activeFilter === "All" || c.cat === activeFilter;
      return categoryOk && matchesSearch(c, query);
    });

    grid.innerHTML = "";
    visible.forEach(function (course) {
      grid.appendChild(renderCard(course));
    });

    noResults.hidden = visible.length !== 0;
    resultCount.textContent = visible.length + " of " + courses.length + " courses shown";
  }

  function setActiveChip(button) {
    chips.forEach(function (chip) {
      var isActive = chip === button;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      activeFilter = chip.getAttribute("data-filter");
      setActiveChip(chip);
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);

  fetch("data/courses.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Could not load course data");
      return res.json();
    })
    .then(function (data) {
      courses = data;
      applyFilters();
    })
    .catch(function (err) {
      grid.innerHTML = "";
      resultCount.textContent = "";
      noResults.hidden = false;
      noResults.textContent = "Courses couldn't be loaded (" + err.message + "). Try refreshing the page.";
    });

  // ---- Course assistant (client-side keyword search, no network) ----
  var openBtn = document.getElementById("open-assistant");
  var closeBtn = document.getElementById("close-assistant");
  var backdrop = document.getElementById("assistant-backdrop");
  var assistantInput = document.getElementById("assistant-input");
  var assistantResults = document.getElementById("assistant-results");
  var lastFocused = null;

  function openAssistant() {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    assistantInput.value = "";
    assistantResults.innerHTML = "";
    assistantInput.focus();
    document.addEventListener("keydown", onAssistantKeydown);
  }

  function closeAssistant() {
    backdrop.hidden = true;
    document.removeEventListener("keydown", onAssistantKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onAssistantKeydown(e) {
    if (e.key === "Escape") {
      closeAssistant();
    }
  }

  function searchAssistant(query) {
    var q = query.trim().toLowerCase();
    assistantResults.innerHTML = "";
    if (!q) return;

    var hits = courses.filter(function (c) {
      var haystack = [c.title, c.summary, c.allergens, c.campus, c.cat, c.level, c.when]
        .join(" ")
        .toLowerCase();
      return haystack.indexOf(q) !== -1;
    }).slice(0, 6);

    if (hits.length === 0) {
      var empty = document.createElement("p");
      empty.className = "assistant-empty";
      empty.textContent = "No courses match “" + query + "”. Try a cuisine, an allergen, or a day of the week.";
      assistantResults.appendChild(empty);
      return;
    }

    hits.forEach(function (course) {
      var a = document.createElement("a");
      a.className = "assistant-hit";
      a.href = "#course-" + course.code;
      a.innerHTML =
        "<b>" + course.title + "</b>" +
        "<span class='hit-meta'>" +
          course.code + " · " + course.campus + " · " + formatFee(course.fee) + " · " + formatWeeks(course.weeks) +
        "</span>";
      a.addEventListener("click", function () {
        closeAssistant();
      });
      assistantResults.appendChild(a);
    });
  }

  openBtn.addEventListener("click", openAssistant);
  closeBtn.addEventListener("click", closeAssistant);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeAssistant();
  });
  assistantInput.addEventListener("input", function () {
    searchAssistant(assistantInput.value);
  });

  // ---- Sign-up dialog (one shared <dialog>, reused for every course) ----
  // Optional: set this to a URL to also POST each sign-up there. Left null
  // by default — there is no backend, sign-ups are saved to localStorage.
  var SIGNUP_ENDPOINT = null;

  var signupDialog = document.getElementById("signup-dialog");
  var signupForm = document.getElementById("signup-form");
  var signupSuccess = document.getElementById("signup-success");
  var signupIntake = document.getElementById("signup-intake");
  var signupName = document.getElementById("signup-name");
  var signupEmail = document.getElementById("signup-email");
  var signupMobile = document.getElementById("signup-mobile");
  var signupExperience = document.getElementById("signup-experience");
  var signupAllergies = document.getElementById("signup-allergies");
  var signupConsent = document.getElementById("signup-consent");
  var signupNewsletter = document.getElementById("signup-newsletter");
  var warnAllergies = document.getElementById("warn-allergies");
  var errName = document.getElementById("err-name");
  var errEmail = document.getElementById("err-email");
  var errMobile = document.getElementById("err-mobile");
  var errConsent = document.getElementById("err-consent");
  var successRef = document.getElementById("success-ref");
  var successMailto = document.getElementById("success-mailto");

  var currentCourse = null;
  var signupLastFocused = null;

  // Singapore mobile: optional +65 (with or without a space), then 6/8/9
  // and 7 more digits, with an optional space after the first 4 digits.
  var SG_MOBILE_RE = /^(\+65\s?)?[689]\d{3}\s?\d{4}$/;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatIntakeDate(iso) {
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return days[d.getDay()] + " " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear() + " (" + iso + ")";
  }

  function courseMentionsNuts(course) {
    return /nut/i.test(course.allergens || "");
  }

  function allergiesMentionNuts(text) {
    return /nut/i.test(text || "");
  }

  function checkNutsWarning() {
    if (currentCourse && courseMentionsNuts(currentCourse) && allergiesMentionNuts(signupAllergies.value)) {
      warnAllergies.textContent = "Heads up: this course's ingredients include nuts (" + currentCourse.allergens + "), and you've mentioned a nut allergy. You can still sign up — we'll follow up before class.";
      warnAllergies.hidden = false;
    } else {
      warnAllergies.hidden = true;
    }
  }

  function openSignup(course) {
    currentCourse = course;
    signupLastFocused = document.activeElement;

    // Reset form to a clean state for this course.
    signupForm.reset();
    signupForm.hidden = false;
    signupSuccess.hidden = true;
    clearFieldError(signupName, errName);
    clearFieldError(signupEmail, errEmail);
    clearFieldError(signupMobile, errMobile);
    signupConsent.setAttribute("aria-invalid", "false");
    errConsent.hidden = true;
    warnAllergies.hidden = true;

    document.getElementById("sc-code-title").textContent = course.code + " · " + course.title;
    document.getElementById("sc-campus").textContent = course.campus;
    document.getElementById("sc-schedule").textContent = course.when;
    document.getElementById("sc-weeks").textContent = formatWeeks(course.weeks);
    document.getElementById("sc-fee").textContent = formatFee(course.fee);

    signupIntake.innerHTML = "";
    course.intakes.forEach(function (iso) {
      var opt = document.createElement("option");
      opt.value = iso;
      opt.textContent = formatIntakeDate(iso);
      signupIntake.appendChild(opt);
    });

    signupDialog.showModal();
    signupName.focus();
  }

  function closeSignup() {
    if (signupDialog.open) signupDialog.close();
    if (signupLastFocused) signupLastFocused.focus();
  }

  function setFieldError(input, errorEl, message) {
    input.setAttribute("aria-invalid", "true");
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearFieldError(input, errorEl) {
    input.setAttribute("aria-invalid", "false");
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  // Validates in order and returns the first invalid field, so the caller
  // can show exactly one problem at a time, per the spec.
  function validateSignup() {
    clearFieldError(signupName, errName);
    clearFieldError(signupEmail, errEmail);
    clearFieldError(signupMobile, errMobile);
    signupConsent.setAttribute("aria-invalid", "false");
    errConsent.hidden = true;

    var name = signupName.value.trim();
    if (name.length < 2) {
      setFieldError(signupName, errName, "Enter your full name (at least 2 characters).");
      return signupName;
    }

    var email = signupEmail.value.trim();
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !EMAIL_RE.test(email)) {
      setFieldError(signupEmail, errEmail, "Enter a valid email address.");
      return signupEmail;
    }

    var mobile = signupMobile.value.trim();
    if (!SG_MOBILE_RE.test(mobile)) {
      setFieldError(signupMobile, errMobile, "Enter a Singapore mobile number, e.g. +65 9123 4567 or 91234567 (starts with 6, 8 or 9).");
      return signupMobile;
    }

    if (!signupConsent.checked) {
      signupConsent.setAttribute("aria-invalid", "true");
      errConsent.textContent = "Please agree to be contacted about this sign-up to continue.";
      errConsent.hidden = false;
      return signupConsent;
    }

    return null;
  }

  function nextReference() {
    var now = new Date();
    var ymd = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
    var seqKey = "cb_signup_seq_" + ymd;
    var seq = parseInt(localStorage.getItem(seqKey) || "1000", 10) + 1;
    try {
      localStorage.setItem(seqKey, String(seq));
    } catch (e) { /* storage unavailable — still return a usable reference */ }
    return "CB-" + ymd + "-" + seq;
  }

  function todayISO() {
    var now = new Date();
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  }

  function saveSignup(record) {
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem("cb_signups") || "[]");
    } catch (e) {
      list = [];
    }
    list.push(record);
    try {
      localStorage.setItem("cb_signups", JSON.stringify(list));
    } catch (e) { /* localStorage unavailable (private mode, quota, etc.) */ }
  }

  function buildMailto(record) {
    var subject = "Sign-up " + record.ref + " — " + record.course_title;
    var body = [
      "Reference: " + record.ref,
      "Course: " + record.course_code + " " + record.course_title,
      "Intake: " + record.intake,
      "Campus: " + currentCourse.campus,
      "Name: " + record.full_name,
      "Email: " + record.email,
      "Mobile: " + record.mobile,
      "Experience: " + record.experience,
      "Allergies: " + (record.allergies || "None given"),
      "Newsletter opt-in: " + record.marketing_opt_in
    ].join("\n");
    return "mailto:enrol@cookbakeacademy.sg?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var invalidField = validateSignup();
    if (invalidField) {
      invalidField.focus();
      return;
    }

    var record = {
      ref: nextReference(),
      submitted: todayISO(),
      course_code: currentCourse.code,
      course_title: currentCourse.title,
      intake: signupIntake.value,
      full_name: signupName.value.trim(),
      email: signupEmail.value.trim(),
      mobile: signupMobile.value.trim(),
      experience: signupExperience.value,
      allergies: signupAllergies.value.trim(),
      marketing_opt_in: signupNewsletter.checked ? "yes" : "no",
      paid: "no"
    };

    saveSignup(record);

    if (SIGNUP_ENDPOINT) {
      fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      }).catch(function () { /* best-effort only — sign-up is already saved locally */ });
    }

    successRef.textContent = record.ref;
    successMailto.href = buildMailto(record);
    signupForm.hidden = true;
    signupSuccess.hidden = false;
  });

  signupAllergies.addEventListener("input", checkNutsWarning);
  signupAllergies.addEventListener("blur", checkNutsWarning);

  document.getElementById("signup-close").addEventListener("click", closeSignup);
  document.getElementById("signup-cancel").addEventListener("click", closeSignup);
  document.getElementById("signup-done").addEventListener("click", closeSignup);
  signupDialog.addEventListener("cancel", function () {
    // Native Escape-to-close; let it happen, just restore focus afterward.
    signupLastFocused = signupLastFocused || document.activeElement;
  });
  signupDialog.addEventListener("close", function () {
    if (signupLastFocused) signupLastFocused.focus();
  });
})();
