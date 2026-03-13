/**
 * NB Accordion Component
 * Collapsible content sections with animation and ARIA support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('accordion', function (el) {
    var mode = el.getAttribute('data-nb-accordion') || 'multiple'; // "single" or "multiple"
    var triggers = NB.$$('[data-nb-accordion-trigger]', el);

    if (!triggers.length) return;

    /* ---------------------------------------------------------------- */
    /*  Setup each trigger                                               */
    /* ---------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      var item = trigger.closest('.nb-accordion__item');
      if (!item) return;

      var content = item.querySelector('.nb-accordion__content') ||
                    item.querySelector('.nb-accordion__body') ||
                    trigger.nextElementSibling;
      if (!content) return;

      // Ensure IDs for ARIA
      var triggerId = trigger.id || NB.uid('accordion-trigger');
      var contentId = content.id || NB.uid('accordion-content');
      trigger.id = triggerId;
      content.id = contentId;

      // ARIA attributes
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-controls', contentId);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', triggerId);

      // Make trigger focusable if not already
      if (!trigger.getAttribute('tabindex') && trigger.tagName !== 'BUTTON' && trigger.tagName !== 'A') {
        trigger.setAttribute('tabindex', '0');
      }

      // Initial state
      var isOpen = item.classList.contains('is-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0';
        content.style.overflow = 'hidden';
      }

      // Store references
      trigger._nbAccordionItem = item;
      trigger._nbAccordionContent = content;
    });

    /* ---------------------------------------------------------------- */
    /*  Toggle logic                                                     */
    /* ---------------------------------------------------------------- */

    function openItem(trigger) {
      var item = trigger._nbAccordionItem;
      var content = trigger._nbAccordionContent;
      if (!item || !content) return;

      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      content.style.overflow = 'hidden';
      content.style.maxHeight = content.scrollHeight + 'px';

      // After transition, remove max-height constraint so dynamic content works
      var onEnd = function () {
        NB.off(content, 'transitionend', onEnd);
        if (item.classList.contains('is-open')) {
          content.style.overflow = '';
          content.style.maxHeight = 'none';
        }
      };
      NB.on(content, 'transitionend', onEnd);

      NB.emit(el, 'nb:accordion-open', { item: item, trigger: trigger });
    }

    function closeItem(trigger) {
      var item = trigger._nbAccordionItem;
      var content = trigger._nbAccordionContent;
      if (!item || !content) return;

      // Set explicit max-height before collapsing (for transition to work)
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.overflow = 'hidden';

      // Force reflow
      void content.offsetHeight;

      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      content.style.maxHeight = '0';

      NB.emit(el, 'nb:accordion-close', { item: item, trigger: trigger });
    }

    function toggle(trigger) {
      var item = trigger._nbAccordionItem;
      if (!item) return;

      if (item.classList.contains('is-open')) {
        closeItem(trigger);
      } else {
        // In single mode, close all others first
        if (mode === 'single') {
          triggers.forEach(function (t) {
            if (t !== trigger && t._nbAccordionItem && t._nbAccordionItem.classList.contains('is-open')) {
              closeItem(t);
            }
          });
        }
        openItem(trigger);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      NB.on(trigger, 'click', function (e) {
        e.preventDefault();
        toggle(trigger);
      });

      NB.on(trigger, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(trigger);
        }
      });
    });
  });

})(window.NB);
