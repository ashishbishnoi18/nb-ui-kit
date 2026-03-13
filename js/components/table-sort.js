/**
 * NB Table Sort Component
 * Sortable table columns with numeric detection and custom sort values.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('table-sort', function (el) {
    var table = el.tagName === 'TABLE' ? el : NB.$('table', el);
    if (!table) return;

    var tbody = NB.$('tbody', table);
    if (!tbody) return;

    var sortButtons = NB.$$('[data-nb-sort]', table);

    // Current sort state
    var currentSortCol = null;
    var currentSortDir = null;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    sortButtons.forEach(function (btn) {
      btn.setAttribute('aria-sort', 'none');
      if (!btn.getAttribute('tabindex') && btn.tagName !== 'BUTTON' && btn.tagName !== 'A') {
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('role', 'button');
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Sorting logic                                                     */
    /* ---------------------------------------------------------------- */

    function getCellValue(row, colIndex) {
      var cells = row.querySelectorAll('td, th');
      if (colIndex >= cells.length) return '';
      var cell = cells[colIndex];
      // Prefer data-sort-value attribute
      if (cell.hasAttribute('data-sort-value')) {
        return cell.getAttribute('data-sort-value');
      }
      return cell.textContent.trim();
    }

    function isNumeric(value) {
      if (value === '') return false;
      // Handle currency, commas, percentages
      var cleaned = value.replace(/[$,% ]/g, '');
      return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
    }

    function parseNumeric(value) {
      var cleaned = String(value).replace(/[$,% ]/g, '');
      return parseFloat(cleaned);
    }

    function getColumnIndex(btn) {
      // Explicit column index
      var explicit = btn.getAttribute('data-nb-sort');
      if (explicit && !isNaN(parseInt(explicit, 10))) {
        return parseInt(explicit, 10);
      }

      // Determine from th position
      var th = btn.closest('th');
      if (!th) return 0;

      var row = th.parentElement;
      var cells = row.querySelectorAll('th');
      for (var i = 0; i < cells.length; i++) {
        if (cells[i] === th) return i;
      }
      return 0;
    }

    function sortTable(colIndex, direction) {
      var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
      if (!rows.length) return;

      // Detect if column is numeric by sampling first non-empty values
      var useNumeric = false;
      var numericCount = 0;
      var totalChecked = 0;
      for (var i = 0; i < rows.length && totalChecked < 10; i++) {
        var val = getCellValue(rows[i], colIndex);
        if (val !== '') {
          totalChecked++;
          if (isNumeric(val)) numericCount++;
        }
      }
      useNumeric = totalChecked > 0 && numericCount / totalChecked >= 0.5;

      // Sort rows
      rows.sort(function (a, b) {
        var valA = getCellValue(a, colIndex);
        var valB = getCellValue(b, colIndex);

        var result;
        if (useNumeric) {
          var numA = parseNumeric(valA);
          var numB = parseNumeric(valB);
          // Handle NaN — push non-numeric to end
          if (isNaN(numA) && isNaN(numB)) result = 0;
          else if (isNaN(numA)) result = 1;
          else if (isNaN(numB)) result = -1;
          else result = numA - numB;
        } else {
          result = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
        }

        return direction === 'desc' ? -result : result;
      });

      // Re-append sorted rows using a DocumentFragment for performance
      var fragment = document.createDocumentFragment();
      rows.forEach(function (row) {
        fragment.appendChild(row);
      });
      tbody.appendChild(fragment);
    }

    /* ---------------------------------------------------------------- */
    /*  Click handler                                                    */
    /* ---------------------------------------------------------------- */

    function handleSort(btn) {
      var colIndex = getColumnIndex(btn);

      // Determine new direction
      var newDir;
      if (currentSortCol === colIndex) {
        newDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        newDir = 'asc';
      }

      // Reset all sort indicators
      sortButtons.forEach(function (b) {
        var th = b.closest('th') || b;
        th.classList.remove('is-sorted-asc', 'is-sorted-desc');
        b.setAttribute('aria-sort', 'none');
      });

      // Apply sort
      sortTable(colIndex, newDir);

      // Update indicators
      var th = btn.closest('th') || btn;
      th.classList.add('is-sorted-' + newDir);
      btn.setAttribute('aria-sort', newDir === 'asc' ? 'ascending' : 'descending');

      currentSortCol = colIndex;
      currentSortDir = newDir;

      NB.emit(table, 'nb:table-sort', {
        column: colIndex,
        direction: newDir
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    sortButtons.forEach(function (btn) {
      NB.on(btn, 'click', function (e) {
        e.preventDefault();
        handleSort(btn);
      });

      NB.on(btn, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort(btn);
        }
      });
    });
  });

})(window.NB);
