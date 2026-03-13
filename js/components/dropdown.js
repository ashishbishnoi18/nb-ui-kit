/**
 * NB Dropdown Component
 * Accessible dropdowns with keyboard navigation and click-outside closing.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Track all active dropdowns for outside-click handling */
  var _active = [];

  /* ------------------------------------------------------------------ */
  /*  Init per dropdown                                                  */
  /* ------------------------------------------------------------------ */

  NB.register('dropdown', function (el) {
    var trigger = NB.$('[data-nb-dropdown-trigger]', el);
    if (!trigger) return;

    var persist = el.hasAttribute('data-nb-dropdown-persist');
    var menu = NB.$('.nb-dropdown__menu', el) ||
               NB.$('[role="menu"]', el) ||
               el.querySelector('ul') ||
               el.querySelector('.nb-dropdown__content');

    if (!menu) return;

    // ARIA setup
    var menuId = menu.id || NB.uid('dropdown-menu');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);

    var items = function () {
      return NB.$$('[role="menuitem"], [data-nb-dropdown-item], li > a, li > button', menu).filter(function (item) {
        return item.offsetParent !== null; // visible only
      });
    };

    function open() {
      if (el.classList.contains('is-open')) return;
      // Close other dropdowns first
      closeAll();
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      _active.push(el);

      // Set role on items
      items().forEach(function (item) {
        if (!item.getAttribute('role')) {
          item.setAttribute('role', 'menuitem');
        }
        item.setAttribute('tabindex', '-1');
      });

      NB.emit(el, 'nb:dropdown-open');
    }

    function close() {
      if (!el.classList.contains('is-open')) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');

      var idx = _active.indexOf(el);
      if (idx !== -1) _active.splice(idx, 1);

      trigger.focus();
      NB.emit(el, 'nb:dropdown-close');
    }

    function toggle() {
      if (el.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    }

    function focusItem(index) {
      var list = items();
      if (!list.length) return;
      if (index < 0) index = list.length - 1;
      if (index >= list.length) index = 0;
      list[index].focus();
    }

    function currentIndex() {
      var list = items();
      var active = document.activeElement;
      for (var i = 0; i < list.length; i++) {
        if (list[i] === active) return i;
      }
      return -1;
    }

    // Trigger click
    NB.on(trigger, 'click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    // Keyboard on trigger
    NB.on(trigger, 'keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          open();
          focusItem(0);
          break;
        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          open();
          focusItem(-1);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          toggle();
          if (el.classList.contains('is-open')) {
            focusItem(0);
          }
          break;
      }
    });

    // Keyboard inside menu
    NB.on(menu, 'keydown', function (e) {
      var idx = currentIndex();

      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          focusItem(idx + 1);
          break;
        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          focusItem(idx - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;
        case 'End':
          e.preventDefault();
          focusItem(items().length - 1);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          close();
          break;
        case 'Enter':
        case ' ':
          // Let the event propagate to the item's click handler
          if (!persist) {
            // Delay close so click can register
            setTimeout(function () { close(); }, 0);
          }
          break;
      }
    });

    // Item click
    NB.on(menu, 'click', function (e) {
      var item = e.target.closest('[role="menuitem"], [data-nb-dropdown-item], li > a, li > button');
      if (item) {
        NB.emit(el, 'nb:dropdown-select', { item: item, value: item.textContent.trim() });
        if (!persist) {
          close();
        }
      }
    });

    // Store close function on element for closeAll
    el._nbDropdownClose = close;
  });

  /* ------------------------------------------------------------------ */
  /*  Close all dropdowns                                                */
  /* ------------------------------------------------------------------ */

  function closeAll() {
    var list = _active.slice();
    list.forEach(function (el) {
      if (el._nbDropdownClose) el._nbDropdownClose();
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Global listeners                                                   */
  /* ------------------------------------------------------------------ */

  // Click outside
  NB.on(document, 'click', function (e) {
    var list = _active.slice();
    list.forEach(function (el) {
      if (!el.contains(e.target) && el._nbDropdownClose) {
        el._nbDropdownClose();
      }
    });
  });

  // Escape key
  NB.on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && _active.length) {
      closeAll();
    }
  });

})(window.NB);
