/**
 * NB Tabs Component
 * Accessible tabs with keyboard navigation and ARIA attributes.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tabs', function (el) {
    var tabButtons = NB.$$('[data-nb-tab]', el);
    if (!tabButtons.length) return;

    // Find or create tablist wrapper
    var tablist = NB.$('[role="tablist"]', el);
    if (!tablist) {
      // Use the parent of the first tab button as tablist
      tablist = tabButtons[0].parentElement;
      tablist.setAttribute('role', 'tablist');
    }

    // Gather all panels
    var panels = {};
    var panelEls = NB.$$('[data-nb-tab-panel]', el);
    panelEls.forEach(function (panel) {
      var panelId = panel.getAttribute('data-nb-tab-panel');
      panels[panelId] = panel;
    });

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    tabButtons.forEach(function (tab) {
      var panelId = tab.getAttribute('data-nb-tab');
      var panel = panels[panelId];

      // Ensure IDs
      if (!tab.id) tab.id = NB.uid('tab');
      if (panel && !panel.id) panel.id = NB.uid('tabpanel');

      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel ? panel.id : '');

      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      }

      // Initial state
      if (tab.classList.contains('is-active')) {
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        if (panel) {
          panel.classList.add('is-active');
          panel.removeAttribute('hidden');
        }
      } else {
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        if (panel) {
          panel.classList.remove('is-active');
          panel.setAttribute('hidden', '');
        }
      }
    });

    // If no tab is initially active, activate the first one
    var hasActive = tabButtons.some(function (t) {
      return t.classList.contains('is-active');
    });
    if (!hasActive && tabButtons.length) {
      activate(tabButtons[0]);
    }

    /* ---------------------------------------------------------------- */
    /*  Activation                                                       */
    /* ---------------------------------------------------------------- */

    function activate(tab) {
      var panelId = tab.getAttribute('data-nb-tab');

      // Deactivate all
      tabButtons.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');

        var pId = t.getAttribute('data-nb-tab');
        var p = panels[pId];
        if (p) {
          p.classList.remove('is-active');
          p.setAttribute('hidden', '');
        }
      });

      // Activate selected
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      tab.focus();

      var panel = panels[panelId];
      if (panel) {
        panel.classList.add('is-active');
        panel.removeAttribute('hidden');
      }

      NB.emit(el, 'nb:tab-change', { tab: tab, panelId: panelId, panel: panel });
    }

    /* ---------------------------------------------------------------- */
    /*  Click handler                                                    */
    /* ---------------------------------------------------------------- */

    tabButtons.forEach(function (tab) {
      NB.on(tab, 'click', function (e) {
        e.preventDefault();
        activate(tab);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    NB.on(tablist, 'keydown', function (e) {
      var currentTab = e.target.closest('[data-nb-tab]');
      if (!currentTab) return;

      var idx = tabButtons.indexOf(currentTab);
      if (idx === -1) return;

      var newIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'Right':
          e.preventDefault();
          newIndex = (idx + 1) % tabButtons.length;
          activate(tabButtons[newIndex]);
          break;

        case 'ArrowLeft':
        case 'Left':
          e.preventDefault();
          newIndex = (idx - 1 + tabButtons.length) % tabButtons.length;
          activate(tabButtons[newIndex]);
          break;

        case 'Home':
          e.preventDefault();
          activate(tabButtons[0]);
          break;

        case 'End':
          e.preventDefault();
          activate(tabButtons[tabButtons.length - 1]);
          break;
      }
    });
  });

})(window.NB);
