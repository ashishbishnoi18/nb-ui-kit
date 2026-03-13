/**
 * NB Tag Input Component
 * Interactive tag/chip creation with keyboard support, duplicates prevention,
 * and optional max-tag limit.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Small X icon SVG used for the remove button */
  var REMOVE_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
    '<line x1="2" y1="2" x2="8" y2="8"/>' +
    '<line x1="8" y1="2" x2="2" y2="8"/>' +
    '</svg>';

  NB.register('tag-input', function (el) {
    var input = NB.$('.nb-tag-input__input', el);
    if (!input) return;

    var maxTags = parseInt(el.getAttribute('data-nb-tag-input-max'), 10) || 0;
    var separator = el.getAttribute('data-nb-tag-input-separator') || ',';

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getAllTags() {
      return NB.$$('.nb-tag-input__tag', el);
    }

    function getAllValues() {
      return getAllTags().map(function (tag) {
        return tag.getAttribute('data-nb-tag-value') || tag.textContent.trim();
      });
    }

    function isDuplicate(value) {
      var lower = value.toLowerCase();
      return getAllValues().some(function (v) {
        return v.toLowerCase() === lower;
      });
    }

    function isAtMax() {
      return maxTags > 0 && getAllTags().length >= maxTags;
    }

    /* ---------------------------------------------------------------- */
    /*  Create tag element                                               */
    /* ---------------------------------------------------------------- */

    function createTag(value) {
      var tag = document.createElement('span');
      tag.className = 'nb-tag-input__tag';
      tag.setAttribute('data-nb-tag-value', value);

      var text = document.createTextNode(value);
      tag.appendChild(text);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'nb-tag-input__tag-remove';
      removeBtn.setAttribute('aria-label', 'Remove ' + value);
      removeBtn.innerHTML = REMOVE_SVG;

      NB.on(removeBtn, 'click', function (e) {
        e.stopPropagation();
        removeTag(tag);
      });

      tag.appendChild(removeBtn);
      return tag;
    }

    /* ---------------------------------------------------------------- */
    /*  Add / Remove                                                     */
    /* ---------------------------------------------------------------- */

    function addTag(value) {
      value = value.trim();
      if (!value) return;
      if (isDuplicate(value)) return;
      if (isAtMax()) return;

      var tag = createTag(value);
      el.insertBefore(tag, input);

      NB.emit(el, 'nb:tag-add', { value: value, tags: getAllValues() });
    }

    function removeTag(tag) {
      var value = tag.getAttribute('data-nb-tag-value') || tag.textContent.trim();
      tag.parentNode.removeChild(tag);

      NB.emit(el, 'nb:tag-remove', { value: value, tags: getAllValues() });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard handling                                                */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'keydown', function (e) {
      var val = input.value;

      if (e.key === 'Enter') {
        e.preventDefault();
        addTag(val);
        input.value = '';
        return;
      }

      if (e.key === 'Backspace' && val === '') {
        var tags = getAllTags();
        if (tags.length) {
          removeTag(tags[tags.length - 1]);
        }
        return;
      }
    });

    /* Handle separator character (e.g. comma) */
    NB.on(input, 'input', function () {
      var val = input.value;

      if (separator && val.indexOf(separator) !== -1) {
        var parts = val.split(separator);
        for (var i = 0; i < parts.length - 1; i++) {
          addTag(parts[i]);
        }
        // Keep whatever is after the last separator for continued typing
        input.value = parts[parts.length - 1];
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Click on wrapper focuses input                                   */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      if (e.target === el) {
        input.focus();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Wire up existing remove buttons (for pre-rendered tags)          */
    /* ---------------------------------------------------------------- */

    NB.$$('.nb-tag-input__tag-remove', el).forEach(function (btn) {
      var tag = btn.closest('.nb-tag-input__tag');
      if (!tag) return;

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        removeTag(tag);
      });
    });
  });

})(window.NB);
