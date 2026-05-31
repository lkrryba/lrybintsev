// Interactions for index.html
// - Collapsible "work" cards (accessible buttons with aria-expanded)
// - Easter-egg "I once…" cycler

(() => {
  // Work cards: toggle aria-expanded; CSS does the rest.
  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('click', () => {
      const expanded = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', String(!expanded));
    });
  });

  // Easter egg
  const ionceItems = [
    { text: "got squashed by my own rucksack in Poland.",     color: "orange" },
    { text: "went bungee jumping in Zimbabwe.",                color: "pink"   },
    { text: "visited the rabbit island in Japan.",             color: "orange" },
    { text: "paid £25 for a chicken Kyiv (it was worth it).",  color: "pink"   },
    { text: "ran a marathon.",                                 color: "orange" },
    { text: "got engaged after 3 weeks (we're still married).",color: "pink"   },
    { text: "dressed as a daffodil for charity.",              color: "orange" },
    { text: "took a cat on a train from Kraków to Duisburg.",  color: "pink"   },
    { text: "attended the Krampuslauf.",                       color: "orange" },
    { text: "did a skydive.",                                  color: "pink"   },
    { text: "petted a cheetah.",                               color: "orange" },
    { text: "snowboarded a black run.",                        color: "pink"   },
    { text: "slept in the Okavango Delta.",                    color: "orange" },
    { text: "fell down some temple steps.",                    color: "pink"   },
    { text: "moved 280 miles away on a whim.",                 color: "orange" },
    { text: "went whale watching and saw zero whales.",        color: "pink"   },
    { text: "stood behind a waterfall.",                       color: "orange" },
    { text: "accidentally took part in a tractor rally.",      color: "pink"   },
  ];

  const ionceBtn = document.getElementById('ionce-button');
  if (ionceBtn) {
    let i = 0;
    const ionceLabel = ionceBtn.querySelector('.ionce-label');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (item) => {
      ionceLabel.textContent = item.text;
      ionceBtn.className = `ionce-button ionce-button--${item.color}`;
    };

    ionceBtn.addEventListener('click', () => {
      i = (i + 1) % ionceItems.length;
      const item = ionceItems[i];

      if (reduceMotion) {
        render(item);
        return;
      }
      ionceBtn.style.opacity = '0';
      setTimeout(() => {
        render(item);
        ionceBtn.style.opacity = '1';
      }, 150);
    });
  }

  // "Things I've Written" carousel: show one page of cards at a time.
  // Page size tracks the grid's column count (3 / 2 / 1 across breakpoints),
  // so mobile shows one card per page. Works on however many cards
  // build-written.js generated; degrades to "show all" without JS.
  const wrGrid = document.querySelector('.wr-grid');
  const wrControls = document.querySelector('.wr-carousel-controls');
  if (wrGrid && wrControls) {
    const cards = Array.from(wrGrid.querySelectorAll('.wr-card'));
    const dotsWrap = wrControls.querySelector('.wr-dots');
    const prevBtn = wrControls.querySelector('.wr-carousel-prev');
    const nextBtn = wrControls.querySelector('.wr-carousel-next');

    if (cards.length && dotsWrap && prevBtn && nextBtn) {
      let page = 0;

      const pageSize = () => {
        if (window.matchMedia('(min-width: 901px)').matches) return 3;
        if (window.matchMedia('(min-width: 601px)').matches) return 2;
        return 1;
      };

      const render = () => {
        const size = pageSize();
        const pageCount = Math.ceil(cards.length / size);

        if (pageCount <= 1) {
          cards.forEach((c) => c.removeAttribute('hidden'));
          wrControls.setAttribute('hidden', '');
          return;
        }

        page = Math.max(0, Math.min(page, pageCount - 1));
        wrControls.removeAttribute('hidden');

        const start = page * size;
        cards.forEach((c, i) => {
          if (i >= start && i < start + size) c.removeAttribute('hidden');
          else c.setAttribute('hidden', '');
        });

        // Rebuild dots if the count changed (e.g. on resize across breakpoints).
        if (dotsWrap.children.length !== pageCount) {
          dotsWrap.innerHTML = '';
          for (let i = 0; i < pageCount; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'wr-dot';
            dot.setAttribute('aria-label', `Go to page ${i + 1}`);
            dot.addEventListener('click', () => {
              page = i;
              render();
            });
            dotsWrap.appendChild(dot);
          }
        }
        Array.from(dotsWrap.children).forEach((dot, i) => {
          dot.setAttribute('aria-current', i === page ? 'true' : 'false');
        });
      };

      // Arrows wrap around: next from the last page loops to the first.
      prevBtn.addEventListener('click', () => {
        const pageCount = Math.ceil(cards.length / pageSize());
        page = (page - 1 + pageCount) % pageCount;
        render();
      });
      nextBtn.addEventListener('click', () => {
        const pageCount = Math.ceil(cards.length / pageSize());
        page = (page + 1) % pageCount;
        render();
      });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 100);
      });

      render();
    }
  }
})();
