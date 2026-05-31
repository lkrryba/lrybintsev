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
})();
