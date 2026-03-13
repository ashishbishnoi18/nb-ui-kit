/**
 * NB Custom Select Component
 * Accessible custom select with search, keyboard navigation, and native fallback.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('select', function (el) {
    var nativeSelect = NB.$('select', el);
    if (!nativeSelect) return;

    var hasSearch = el.hasAttribute('data-nb-select-search');
    var trigger = NB.$('.nb-select__trigger', el) || NB.$('[data-nb-select-trigger]', el);
    var dropdown = NB.$('.nb-select__dropdown', el) || NB.$('[data-nb-select-dropdown]', el);

    /* ---------------------------------------------------------------- */
    /*  Build custom UI if not already present                           */
    /* ---------------------------------------------------------------- */

    if (!trigger) {
      trigger = document.createElement('button');
      trigger.className = 'nb-select__trigger';
      trigger.setAttribute('type', 'button');
      el.appendChild(trigger);
    }

    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-select__dropdown';
      el.appendChild(dropdown);
    }

    // ARIA setup
    var listboxId = NB.uid('select-listbox');
    var triggerId = trigger.id || NB.uid('select-trigger');
    trigger.id = triggerId;
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', listboxId);

    // Build search input
    var searchInput = null;
    if (hasSearch) {
      searchInput = NB.$('.nb-select__search', dropdown) || NB.$('input[type="search"]', dropdown);
      if (!searchInput) {
        searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.className = 'nb-select__search';
        searchInput.setAttribute('placeholder', 'Search...');
        searchInput.setAttribute('aria-label', 'Search options');
        dropdown.insertBefore(searchInput, dropdown.firstChild);
      }
    }

    // Build options list
    var listbox = NB.$('[role="listbox"]', dropdown);
    if (!listbox) {
      listbox = document.createElement('ul');
      listbox.className = 'nb-select__options';
      dropdown.appendChild(listbox);
    }
    listbox.id = listboxId;
    listbox.setAttribute('role', 'listbox');
    listbox.setAttribute('aria-labelledby', triggerId);

    // Hide native select
    nativeSelect.setAttribute('tabindex', '-1');
    nativeSelect.setAttribute('aria-hidden', 'true');
    nativeSelect.style.position = 'absolute';
    nativeSelect.style.width = '1px';
    nativeSelect.style.height = '1px';
    nativeSelect.style.overflow = 'hidden';
    nativeSelect.style.clip = 'rect(0,0,0,0)';
    nativeSelect.style.border = '0';

    /* ---------------------------------------------------------------- */
    /*  Populate options from native select                              */
    /* ---------------------------------------------------------------- */

    function buildOptions() {
      listbox.innerHTML = '';
      var options = nativeSelect.options;

      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        if (opt.disabled && opt.value === '') continue; // skip placeholder

        var li = document.createElement('li');
        li.className = 'nb-select__option';
        li.setAttribute('role', 'option');
        li.setAttribute('data-value', opt.value);
        li.setAttribute('tabindex', '-1');
        li.textContent = opt.textContent;

        if (opt.selected) {
          li.classList.add('is-selected');
          li.setAttribute('aria-selected', 'true');
        } else {
          li.setAttribute('aria-selected', 'false');
        }

        listbox.appendChild(li);
      }
    }

    buildOptions();
    updateTriggerText();

    function updateTriggerText() {
      var selected = nativeSelect.options[nativeSelect.selectedIndex];
      if (selected) {
        trigger.textContent = selected.textContent;
      } else {
        trigger.textContent = '';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                      */
    /* ---------------------------------------------------------------- */

    function open() {
      if (el.classList.contains('is-open')) return;
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');

      if (searchInput) {
        searchInput.value = '';
        filterOptions('');
        searchInput.focus();
      } else {
        // Focus the selected option or first option
        var selected = NB.$('.is-selected', listbox);
        if (selected) {
          selected.focus();
        } else {
          var first = NB.$('[role="option"]', listbox);
          if (first) first.focus();
        }
      }

      NB.emit(el, 'nb:select-open');
    }

    function close() {
      if (!el.classList.contains('is-open')) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
      NB.emit(el, 'nb:select-close');
    }

    function selectOption(li) {
      if (!li) return;
      var value = li.getAttribute('data-value');

      // Update native select
      nativeSelect.value = value;

      // Update visual state
      NB.$$('[role="option"]', listbox).forEach(function (opt) {
        opt.classList.remove('is-selected');
        opt.setAttribute('aria-selected', 'false');
      });
      li.classList.add('is-selected');
      li.setAttribute('aria-selected', 'true');

      updateTriggerText();
      close();

      // Dispatch change event on native select
      var changeEvent = new Event('change', { bubbles: true });
      nativeSelect.dispatchEvent(changeEvent);

      NB.emit(el, 'nb:select-change', { value: value, text: li.textContent });
    }

    /* ---------------------------------------------------------------- */
    /*  Search / filter                                                  */
    /* ---------------------------------------------------------------- */

    function filterOptions(query) {
      query = query.toLowerCase().trim();
      var options = NB.$$('[role="option"]', listbox);

      options.forEach(function (opt) {
        var text = opt.textContent.toLowerCase();
        if (!query || text.indexOf(query) !== -1) {
          opt.style.display = '';
          opt.removeAttribute('hidden');
        } else {
          opt.style.display = 'none';
          opt.setAttribute('hidden', '');
        }
      });
    }

    if (searchInput) {
      NB.on(searchInput, 'input', function () {
        filterOptions(searchInput.value);
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    function getVisibleOptions() {
      return NB.$$('[role="option"]', listbox).filter(function (opt) {
        return !opt.hasAttribute('hidden') && opt.style.display !== 'none';
      });
    }

    function focusOption(index) {
      var opts = getVisibleOptions();
      if (!opts.length) return;
      if (index < 0) index = opts.length - 1;
      if (index >= opts.length) index = 0;
      opts[index].focus();
    }

    function currentOptionIndex() {
      var opts = getVisibleOptions();
      var active = document.activeElement;
      for (var i = 0; i < opts.length; i++) {
        if (opts[i] === active) return i;
      }
      return -1;
    }

    // Trigger events
    NB.on(trigger, 'click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (el.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    });

    NB.on(trigger, 'keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
        case 'ArrowUp':
        case 'Up':
        case 'Enter':
        case ' ':
          e.preventDefault();
          open();
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    });

    // Dropdown keyboard
    var handleDropdownKeydown = function (e) {
      var idx = currentOptionIndex();

      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          focusOption(idx + 1);
          break;
        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          if (idx <= 0 && searchInput) {
            searchInput.focus();
          } else {
            focusOption(idx - 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          focusOption(0);
          break;
        case 'End':
          e.preventDefault();
          focusOption(getVisibleOptions().length - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (document.activeElement && document.activeElement.getAttribute('role') === 'option') {
            selectOption(document.activeElement);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          close();
          break;
      }
    };

    NB.on(dropdown, 'keydown', handleDropdownKeydown);

    // Search input arrow down moves to options
    if (searchInput) {
      NB.on(searchInput, 'keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'Down') {
          e.preventDefault();
          focusOption(0);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          close();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          var opts = getVisibleOptions();
          if (opts.length === 1) {
            selectOption(opts[0]);
          }
        }
      });
    }

    // Option click
    NB.on(listbox, 'click', function (e) {
      var opt = e.target.closest('[role="option"]');
      if (opt) {
        e.preventDefault();
        selectOption(opt);
      }
    });

    // Click outside
    NB.on(document, 'click', function (e) {
      if (!el.contains(e.target) && el.classList.contains('is-open')) {
        close();
      }
    });

    // Sync if native select changes externally
    NB.on(nativeSelect, 'change', function () {
      buildOptions();
      updateTriggerText();
    });
  });

})(window.NB);
