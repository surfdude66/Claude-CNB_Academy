(function () {
  "use strict";

  // Must match signups-format.csv exactly: column names and order.
  var CSV_COLUMNS = [
    "ref", "submitted", "course_code", "course_title", "intake",
    "full_name", "email", "mobile", "experience", "allergies",
    "marketing_opt_in", "paid"
  ];

  var tableBody = document.getElementById("admin-body");
  var emptyState = document.getElementById("admin-empty");
  var countEl = document.getElementById("admin-count");
  var exportBtn = document.getElementById("export-csv");

  function loadSignups() {
    try {
      return JSON.parse(localStorage.getItem("cb_signups") || "[]");
    } catch (e) {
      return [];
    }
  }

  function renderTable() {
    var signups = loadSignups();
    tableBody.innerHTML = "";

    if (signups.length === 0) {
      emptyState.hidden = false;
      countEl.textContent = "";
      exportBtn.disabled = true;
      return;
    }

    emptyState.hidden = true;
    exportBtn.disabled = false;
    countEl.textContent = signups.length + (signups.length === 1 ? " sign-up" : " sign-ups");

    signups.forEach(function (s) {
      var tr = document.createElement("tr");
      CSV_COLUMNS.forEach(function (col) {
        var td = document.createElement("td");
        td.textContent = s[col] || "";
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  function csvEscape(value) {
    var str = value === undefined || value === null ? "" : String(value);
    if (/[",\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function exportCsv() {
    var signups = loadSignups();
    var lines = [CSV_COLUMNS.join(",")];
    signups.forEach(function (s) {
      lines.push(CSV_COLUMNS.map(function (col) {
        return csvEscape(s[col]);
      }).join(","));
    });
    var csv = lines.join("\r\n") + "\r\n";

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    var today = new Date();
    var stamp = today.getFullYear() + String(today.getMonth() + 1).padStart(2, "0") + String(today.getDate()).padStart(2, "0");
    a.download = "signups-" + stamp + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportBtn.addEventListener("click", exportCsv);
  renderTable();
})();
