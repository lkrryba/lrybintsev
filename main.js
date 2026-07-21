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
      ionceBtn.style.transform = 'translateY(3px)';
      setTimeout(() => {
        render(item);
        ionceBtn.style.opacity = '1';
        ionceBtn.style.transform = 'none';
      }, 150);
    });
  }

  // "Things I've Written" — live Substack feed + carousel.
  //
  // Posts are pulled from the Substack RSS feed when the page loads (same
  // pattern as the shorts shelf above). Browsers can't read the feed
  // cross-origin directly, so it goes through a free RSS-to-JSON relay.
  //  - Feed has posts  -> the placeholder local "Blog" cards are removed and
  //                       the live Substack posts are shown ahead of the
  //                       external (Medium / freeCodeCamp) cards.
  //  - Feed empty or relay unreachable -> whatever is baked into index.html
  //                       stays put, so the section never ends up blank.
  // The carousel then runs over whatever cards ended up in the grid.
  const SUBSTACK_FEED = 'https://leanne14.substack.com/feed';
  const SUBSTACK_LIMIT = 9;

  // Carousel: show one page of cards at a time. Page size tracks the grid's
  // column count (3 / 2 / 1 across breakpoints). Degrades to "show all"
  // without JS. Called once, after the feed load settles.
  const initWrittenCarousel = () => {
    const wrGrid = document.querySelector('.wr-grid');
    const wrControls = document.querySelector('.wr-carousel-controls');
    if (!wrGrid || !wrControls) return;

    const cards = Array.from(wrGrid.querySelectorAll('.wr-card'));
    const dotsWrap = wrControls.querySelector('.wr-dots');
    const prevBtn = wrControls.querySelector('.wr-carousel-prev');
    const nextBtn = wrControls.querySelector('.wr-carousel-next');
    if (!(cards.length && dotsWrap && prevBtn && nextBtn)) return;

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
  };

  // Build one card in the site's existing markup. textContent (not innerHTML)
  // so a post title from the feed can never inject markup.
  const substackCard = (title, href) => {
    const article = document.createElement('article');
    article.className = 'wr-card';

    const type = document.createElement('div');
    type.className = 'wr-card-type';
    type.textContent = 'Substack';

    const heading = document.createElement('div');
    heading.className = 'wr-card-title';
    heading.textContent = title;

    const link = document.createElement('a');
    link.className = 'wr-card-link';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Read ↗';

    article.append(type, heading, link);
    return article;
  };

  const loadSubstackFeed = async () => {
    const wrGrid = document.querySelector('.wr-grid');
    if (!wrGrid) return;

    try {
      const endpoint =
        'https://api.rss2json.com/v1/api.json?rss_url=' +
        encodeURIComponent(SUBSTACK_FEED);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`relay ${res.status}`);
      const data = await res.json();
      const items =
        data && data.status === 'ok' && Array.isArray(data.items) ? data.items : [];
      if (!items.length) return; // empty feed: keep the baked cards as-is

      // Drop the placeholder local "Blog" cards (the ones being retired), keep
      // the external cards, and slot the live Substack posts in at the front.
      wrGrid.querySelectorAll('.wr-card').forEach((card) => {
        const kind = card.querySelector('.wr-card-type');
        if (kind && kind.textContent.trim() === 'Blog') card.remove();
      });

      const frag = document.createDocumentFragment();
      items.slice(0, SUBSTACK_LIMIT).forEach((it) => {
        if (it && it.title && it.link) frag.appendChild(substackCard(it.title, it.link));
      });

      const firstRemaining = wrGrid.querySelector('.wr-card');
      if (firstRemaining) wrGrid.insertBefore(frag, firstRemaining);
      else wrGrid.appendChild(frag);
    } catch (e) {
      // Relay down or bad response: leave the baked cards as the fallback.
    }
  };

  loadSubstackFeed().then(initWrittenCarousel);

  // ---------------------------------------------------------------------
  // YouTube Shorts shelf
  //
  // Dynamic mode: set YT_API_KEY to a YouTube Data API v3 key (restrict it
  // to this domain in Google Cloud Console). The newest shorts are fetched
  // from the channel's shorts playlist and cached for 6 hours.
  //
  // Fallback mode: if the key is empty or the API call fails, the manual
  // list below is used instead.
  //
  // Cards are click-to-play: thumbnail first, iframe embed swapped in on
  // click, so page load stays fast.
  // ---------------------------------------------------------------------
  const YT_API_KEY = ''; // <- paste key here for auto-updating shorts
  // Channel ID UCcVIHAWGsOndLoxm9GEe03g -> shorts playlist (UC -> UUSH).
  // Unofficial but widely used; the manual list below covers us if it breaks.
  const YT_SHORTS_PLAYLIST = 'UUSHcVIHAWGsOndLoxm9GEe03g';
  const SHORTS_LIMIT = 12;
  const SHORTS_CACHE_KEY = 'shorts-cache-v1';
  const SHORTS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  // Manual fallback list: id is the part after youtube.com/shorts/
  const shortsFallback = [
    { id: "Fmnx8Z3scsA", title: "Too many tasks? Do this." },
    { id: "ljE81wXtH0U", title: "Where will AI em dash epidemic end?" },
    { id: "eugAWJV0uXk", title: "I tried Claude Fable and I have questions" },
    { id: "nJ9A57QxdD0", title: "AI was rude again and apparently its my fault" },
    { id: "YNVh87DCNQw", title: "Claude did a thing and now I\u2019m scared" },
    { id: "-hgE787vI24", title: "More keyboard shortcuts I use in my daily workflow \u2728" },
    { id: "Xw5moFOJ-NQ", title: "When AI is rude featuring my cat \ud83d\udc08\u200d\u2b1b" },
  ];

  const shelf = document.getElementById('shorts-shelf');
  const shelfLabel = document.getElementById('shorts-label');

  const renderShorts = (items) => {
    if (!items.length) return;
    shelf.removeAttribute('hidden');
    shelfLabel.removeAttribute('hidden');
    const shortsBlurb = document.getElementById('shorts-blurb');
    if (shortsBlurb) shortsBlurb.removeAttribute('hidden');
    shelf.innerHTML = '';

    items.forEach(({ id, title }) => {
      const card = document.createElement('div');
      card.className = 'short-card';

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'short-card-play';
      playBtn.setAttribute('aria-label', `Play short: ${title}`);

      const img = document.createElement('img');
      // Use the custom thumbnail set on YouTube (served from the standard
      // endpoints). The `oarN.jpg` variants are YouTube's auto-generated
      // vertical crops, which ignore the uploaded thumbnail.
      img.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
      img.alt = title;
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        // Fall back to the lower-res custom thumbnail if maxres isn't available.
        if (!img.dataset.fallback) {
          img.dataset.fallback = '1';
          img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        }
      });

      const badge = document.createElement('span');
      badge.className = 'short-card-badge';
      badge.textContent = 'Short';

      const label = document.createElement('span');
      label.className = 'short-card-title';
      label.textContent = title;

      playBtn.append(img, badge, label);

      // Click to play: swap the thumbnail for an embed, in place.
      playBtn.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`;
        iframe.title = title;
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        card.replaceChildren(iframe);
      }, { once: true });

      card.appendChild(playBtn);
      shelf.appendChild(card);
    });
  };

  const loadShorts = async () => {
    if (!YT_API_KEY) {
      renderShorts(shortsFallback);
      return;
    }

    // Serve from cache when fresh.
    try {
      const cached = JSON.parse(localStorage.getItem(SHORTS_CACHE_KEY));
      if (cached && Date.now() - cached.time < SHORTS_CACHE_TTL) {
        renderShorts(cached.items);
        return;
      }
    } catch (e) { /* ignore bad cache */ }

    try {
      const url = 'https://www.googleapis.com/youtube/v3/playlistItems' +
        `?part=snippet&maxResults=${SHORTS_LIMIT}` +
        `&playlistId=${YT_SHORTS_PLAYLIST}&key=${YT_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const items = (data.items || []).map((it) => ({
        id: it.snippet.resourceId.videoId,
        title: it.snippet.title,
      }));
      if (!items.length) throw new Error('No items');
      try {
        localStorage.setItem(SHORTS_CACHE_KEY, JSON.stringify({ time: Date.now(), items }));
      } catch (e) { /* storage full/blocked; fine */ }
      renderShorts(items);
    } catch (e) {
      renderShorts(shortsFallback);
    }
  };

  if (shelf && shelfLabel) loadShorts();

  // Scroll reveals + stat count-up.
  // Classes are only added with JS running and motion allowed, so the page
  // is fully visible without JS and for reduced-motion users.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll(
      'main section:not(#hero) .section-heading, ' +
      '.work-card, .project-card, .bg-card, .wr-card, .beyond-item, .connect-inner'
    );

    revealTargets.forEach((el) => {
      el.classList.add('reveal');
      // Gentle stagger between siblings, capped so nothing feels slow.
      const i = Array.from(el.parentElement.children).indexOf(el);
      el.style.transitionDelay = `${Math.min(i, 3) * 45}ms`;
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    revealTargets.forEach((el) => revealObserver.observe(el));

    // Count the stats up from 0 the first time the stats bar scrolls into view.
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) {
      const animateStat = (el) => {
        const match = el.textContent.trim().match(/^(\d+)(.*)$/);
        if (!match) return;
        const target = parseInt(match[1], 10);
        const suffix = match[2];
        const duration = 700;
        let start;
        const tick = (ts) => {
          if (start === undefined) start = ts;
          const t = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };

      const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            statsBar.querySelectorAll('.stat-number').forEach(animateStat);
            statsObserver.unobserve(statsBar);
          }
        });
      }, { threshold: 0.4 });

      statsObserver.observe(statsBar);
    }
  }
})();
