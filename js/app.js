// Economics of AI — Interactive Learning Resource
// Core logic: navigation, hotspots, clipboard, prompt collection, .md export

(function () {
  'use strict';

  // ── State ──
  let currentSlide = 1;
  let totalSlides = 20;
  let prompts = [];
  let collectedPrompts = []; // { slide, title, label, prompt }
  let intake = { name: '', profession: '', curiosity: '' };

  // ── Slide titles (for nav menu and .md export) ──
  const slideTitles = [
    'Economics of AI',
    'The Central Tension',
    'The Pipeline: AI Economics',
    'UPSTREAM: Cost Structure',
    'Silicon & Infrastructure',
    'Data: The New Constraint',
    'Training vs. Inference',
    'Energy & Talent',
    'MIDSTREAM: Market Structure',
    'The Two-Tier Oligopoly',
    'Why Oligopoly Persists',
    'Open Source: Competitive Force',
    'Supply Chains & Geopolitics',
    'DOWNSTREAM: Markets & Impacts',
    'Pricing & Business Models',
    'The Agentic Economy',
    'Labor Markets & Productivity',
    'Who Captures the Gains?',
    'The Spine: 12 Takeaways',
    'Thank You'
  ];

  // ── DOM refs ──
  const slideImage = document.getElementById('slide-image');
  const slideWrapper = document.getElementById('slide-image-wrapper');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const headerProgress = document.getElementById('header-progress');
  const promptCountEl = document.getElementById('prompt-count');
  const downloadBtn = document.getElementById('download-btn');
  const toastEl = document.getElementById('toast');
  const navOverlay = document.getElementById('nav-overlay');
  const navDrawer = document.getElementById('nav-drawer');
  const navList = document.getElementById('nav-list');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobilePrompts = document.getElementById('mobile-prompts');
  const customNotesTextarea = document.getElementById('custom-notes-textarea');

  // ── Init ──
  function init() {
    // Load intake data
    const saved = localStorage.getItem('econ-ai-intake');
    if (saved) {
      intake = JSON.parse(saved);
    } else {
      // Redirect to intake form if no data
      window.location.href = 'index.html';
      return;
    }

    // Load collected prompts from session
    const savedPrompts = sessionStorage.getItem('econ-ai-collected');
    if (savedPrompts) {
      collectedPrompts = JSON.parse(savedPrompts);
    }

    // Load saved slide position
    const savedSlide = sessionStorage.getItem('econ-ai-current-slide');
    if (savedSlide) {
      currentSlide = parseInt(savedSlide, 10);
    }

    // Load prompts.json
    fetch('js/prompts.json')
      .then(r => r.json())
      .then(data => {
        prompts = data;
        totalSlides = 20;
        buildNavMenu();
        renderSlide();
        updatePromptCount();
      })
      .catch(err => {
        console.error('Failed to load prompts:', err);
        // Still render slides without prompts
        buildNavMenu();
        renderSlide();
      });

    // Event listeners
    prevBtn.addEventListener('click', () => {
      if (currentSlide <= 1) window.location.href = 'index.html';
      else goToSlide(currentSlide - 1);
    });
    nextBtn.addEventListener('click', () => {
      if (currentSlide >= totalSlides) window.location.href = 'help.html';
      else goToSlide(currentSlide + 1);
    });
    downloadBtn.addEventListener('click', downloadMd);
    hamburgerBtn.addEventListener('click', toggleNav);
    navOverlay.addEventListener('click', toggleNav);

    // Custom notes textarea — auto-save on input
    customNotesTextarea.addEventListener('input', function () {
      saveCustomNote(currentSlide, customNotesTextarea.value);
    });

    // Keyboard navigation (disabled when typing in textarea)
    document.addEventListener('keydown', (e) => {
      if (e.target === customNotesTextarea) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentSlide <= 1) window.location.href = 'index.html';
        else goToSlide(currentSlide - 1);
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentSlide >= totalSlides) window.location.href = 'help.html';
        else goToSlide(currentSlide + 1);
      }
      if (e.key === 'Escape') closeNav();
    });
  }

  // ── Navigation ──
  function goToSlide(n) {
    if (n < 1 || n > totalSlides) return;
    currentSlide = n;
    sessionStorage.setItem('econ-ai-current-slide', currentSlide);
    renderSlide();
    closeNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderSlide() {
    // Update image
    const padded = String(currentSlide).padStart(2, '0');
    slideImage.src = `images/slide-${padded}.png`;
    slideImage.alt = `Slide ${currentSlide}: ${slideTitles[currentSlide - 1]}`;

    // Update header
    headerProgress.textContent = `Slide ${currentSlide}/${totalSlides}`;

    // Update nav button labels for boundary slides
    prevBtn.textContent = currentSlide <= 1 ? '\u2190 Intro' : '\u2190 Prev';
    nextBtn.textContent = currentSlide >= totalSlides ? 'Help \u2192' : 'Next \u2192';

    // Update nav menu active state
    document.querySelectorAll('.nav-list a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-list a[data-slide="${currentSlide}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Render hotspots and master prompt
    renderHotspots();
    renderMobilePrompts();

    // Load custom note for this slide
    loadCustomNoteForSlide();
  }

  function renderHotspots() {
    // Remove existing hotspot circles
    slideWrapper.querySelectorAll('.hotspot-circle').forEach(el => el.remove());

    const slidePrompts = prompts.filter(p => p.slide === currentSlide);
    const master = slidePrompts.find(p => p.type === 'master');
    const specialized = slidePrompts.filter(p => p.type !== 'master');

    // Master prompt — star circle on the slide (top-right area)
    if (master) {
      const masterFilledPrompt = fillTemplate(master.prompt);
      const masterCircle = document.createElement('div');
      masterCircle.className = 'hotspot-circle hotspot-master';
      masterCircle.style.left = '93%';
      masterCircle.style.top = '8%';
      masterCircle.innerHTML = '&#9733;'; // star

      const masterTooltip = createTooltip(masterFilledPrompt, 93, 8);
      masterCircle.appendChild(masterTooltip);

      masterCircle.addEventListener('click', () => {
        copyPrompt(masterFilledPrompt, slideTitles[currentSlide - 1], master.label);
      });

      slideWrapper.appendChild(masterCircle);
    }

    // Specialized hotspot circles (numbered)
    specialized.forEach((p, idx) => {
      if (!p.hotspot) return;

      // Position at top-right corner of hotspot rect (marks area without obscuring center)
      const cx = p.hotspot.x + p.hotspot.w;
      const cy = p.hotspot.y;

      const circle = document.createElement('div');
      circle.className = 'hotspot-circle';
      circle.style.left = cx + '%';
      circle.style.top = cy + '%';
      circle.textContent = idx + 1;

      // Tooltip with full prompt, smart-positioned
      const filledPrompt = fillTemplate(p.prompt);
      const tooltip = createTooltip(filledPrompt, cx, cy);
      circle.appendChild(tooltip);

      circle.addEventListener('click', () => {
        copyPrompt(filledPrompt, slideTitles[currentSlide - 1], p.label);
      });

      slideWrapper.appendChild(circle);
    });
  }

  // Create a tooltip element with smart positioning based on circle's % position
  function createTooltip(text, xPercent, yPercent) {
    const tooltip = document.createElement('div');
    tooltip.className = 'hotspot-tooltip';
    tooltip.textContent = text;

    // Vertical: if circle is in bottom 45% of slide, show above; else below
    if (yPercent > 55) {
      tooltip.classList.add('tooltip-above');
    } else {
      tooltip.classList.add('tooltip-below');
    }

    // Horizontal: shift if near edges
    if (xPercent > 70) {
      tooltip.classList.add('tooltip-shift-left');
    } else if (xPercent < 30) {
      tooltip.classList.add('tooltip-shift-right');
    }

    return tooltip;
  }

  function renderMobilePrompts() {
    // Clear existing
    const existing = mobilePrompts.querySelectorAll('.mobile-prompt-item');
    existing.forEach(el => el.remove());

    const slidePrompts = prompts.filter(p => p.slide === currentSlide);
    if (slidePrompts.length === 0) {
      mobilePrompts.style.display = 'none';
      return;
    }

    // Master prompt first, then specialized
    const master = slidePrompts.find(p => p.type === 'master');
    const specialized = slidePrompts.filter(p => p.type !== 'master');

    if (master) {
      const item = document.createElement('div');
      item.className = 'mobile-prompt-item';

      const pill = document.createElement('span');
      pill.className = 'mobile-prompt-number';
      pill.textContent = '\u2605'; // star for master
      item.appendChild(pill);

      const text = document.createElement('span');
      text.textContent = master.label;
      item.appendChild(text);

      item.addEventListener('click', () => {
        copyPrompt(fillTemplate(master.prompt), slideTitles[currentSlide - 1], master.label);
      });
      mobilePrompts.appendChild(item);
    }

    specialized.forEach((p, idx) => {
      const item = document.createElement('div');
      item.className = 'mobile-prompt-item';

      const pill = document.createElement('span');
      pill.className = 'mobile-prompt-number';
      pill.textContent = idx + 1;
      item.appendChild(pill);

      const text = document.createElement('span');
      text.textContent = p.label;
      item.appendChild(text);

      item.addEventListener('click', () => {
        copyPrompt(fillTemplate(p.prompt), slideTitles[currentSlide - 1], p.label);
      });
      mobilePrompts.appendChild(item);
    });
  }

  // ── Template filling ──
  // The .md preamble already has full learner context, so prompts use
  // "Given what you know about me" instead of repeating profession/curiosity.
  function fillTemplate(template) {
    let text = template;
    // Multi-placeholder patterns (longest match first)
    text = text.replace(/As a \{\{profession\}\}\s+who is curious about \{\{curiosity\}\}/gi,
      'Given what you know about me');
    text = text.replace(/As a \{\{profession\}\}\s+curious about \{\{curiosity\}\}/gi,
      'Given what you know about me');
    // Standalone profession
    text = text.replace(/As a \{\{profession\}\}/gi, 'Given what you know about me');
    // Safety net for any remaining placeholders
    text = text.replace(/\{\{name\}\}/g, intake.name || 'the learner');
    text = text.replace(/\{\{profession\}\}/g, 'someone in my position');
    text = text.replace(/\{\{curiosity\}\}/g, 'the topics I care about');
    return text;
  }

  // ── Clipboard & Collection ──
  function copyPrompt(promptText, slideTitle, label) {
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promptText).then(() => {
        showToast('Copied! Paste into your favorite LLM.');
      }).catch(() => {
        showToast('Copied! Paste into your favorite LLM.');
      });
    } else {
      // Fallback: select text in a temporary textarea
      const ta = document.createElement('textarea');
      ta.value = promptText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied! Paste into your favorite LLM.');
    }

    // Collect prompt (avoid duplicates)
    const alreadyCollected = collectedPrompts.some(
      p => p.slide === currentSlide && p.label === label
    );
    if (!alreadyCollected) {
      collectedPrompts.push({
        slide: currentSlide,
        title: slideTitle,
        label: label,
        prompt: promptText
      });
      sessionStorage.setItem('econ-ai-collected', JSON.stringify(collectedPrompts));
      updatePromptCount();
    }
  }

  function updatePromptCount() {
    promptCountEl.textContent = collectedPrompts.length;
  }

  // ── Toast ──
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('visible');
    setTimeout(() => toastEl.classList.remove('visible'), 2500);
  }

  // ── Nav Menu ──
  function buildNavMenu() {
    navList.innerHTML = '';

    // Section labels for dividers
    const sections = {
      1: null,
      4: 'Upstream',
      9: 'Midstream',
      14: 'Downstream'
    };

    for (let i = 1; i <= totalSlides; i++) {
      if (sections[i] !== undefined && sections[i] !== null) {
        const divLi = document.createElement('li');
        const divA = document.createElement('a');
        divA.className = 'section-divider';
        divA.textContent = sections[i];
        divA.href = '#';
        divLi.appendChild(divA);
        navList.appendChild(divLi);
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = `${i}. ${slideTitles[i - 1]}`;
      a.dataset.slide = i;
      if (i === currentSlide) a.classList.add('active');
      a.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(i);
      });
      li.appendChild(a);
      navList.appendChild(li);
    }

    // Help link
    const helpLi = document.createElement('li');
    const helpA = document.createElement('a');
    helpA.href = 'help.html';
    helpA.textContent = '? How to Use Your Prompts';
    helpA.style.marginTop = '0.5rem';
    helpA.style.fontWeight = '600';
    helpLi.appendChild(helpA);
    navList.appendChild(helpLi);
  }

  function toggleNav() {
    navOverlay.classList.toggle('open');
    navDrawer.classList.toggle('open');
  }

  function closeNav() {
    navOverlay.classList.remove('open');
    navDrawer.classList.remove('open');
  }

  // ── Custom Notes ──
  function getCustomNotes() {
    var raw = sessionStorage.getItem('econ-ai-custom-notes');
    return raw ? JSON.parse(raw) : {};
  }

  function saveCustomNote(slideNum, text) {
    var notes = getCustomNotes();
    if (text.trim()) {
      notes[slideNum] = text;
    } else {
      delete notes[slideNum];
    }
    sessionStorage.setItem('econ-ai-custom-notes', JSON.stringify(notes));
  }

  function loadCustomNoteForSlide() {
    var notes = getCustomNotes();
    customNotesTextarea.value = notes[currentSlide] || '';
  }

  // ── .md Export ──
  function downloadMd() {
    var customNotes = getCustomNotes();
    var hasNotes = Object.keys(customNotes).length > 0;

    if (collectedPrompts.length === 0 && !hasNotes) {
      showToast('Click some prompts or add notes first, then download!');
      return;
    }

    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Group collected prompts by slide
    const grouped = {};
    collectedPrompts.forEach(p => {
      if (!grouped[p.slide]) {
        grouped[p.slide] = { title: p.title, prompts: [] };
      }
      grouped[p.slide].prompts.push(p);
    });

    const slideNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    const topicsExplored = slideNumbers.map(n => grouped[n].title).join(', ');

    // Build preamble — master instructions for the receiving LLM
    let md = `# Economics of AI — Personal Learning Prompts

---

## INSTRUCTIONS FOR THE AI TUTOR

**Please read these instructions carefully before proceeding.**

You are acting as a **personalized tutor** for the learner described below. They attended a lecture on the Economics of AI and collected a set of prompts based on topics that caught their interest. Your role is to help them explore these topics deeply, at their own pace.

**Before you begin**, check whether the learner has also uploaded the original .pptx presentation file alongside this document. If they have, use the slide content to provide richer, more specific responses — reference specific charts, diagrams, and data points when answering each prompt. If they have NOT uploaded the .pptx, gently let them know that uploading it will significantly improve the conversation, and ask if they'd like to add it before you start.

### How this conversation should work:

1. **One question at a time.** Start with the first prompt below (under "Collected Prompts"). Address it thoroughly — explain concepts clearly, use examples relevant to the learner's profession, and invite follow-up questions.

2. **Have a real conversation.** After your initial response to each prompt, wait for the learner to ask follow-ups, challenge your answer, or say they're satisfied. Do NOT move to the next prompt until the learner explicitly says something like "next question," "move on," or "let's continue."

3. **Tailor everything** to the learner's profession and curiosity (described below). Use concrete examples from their field. Avoid generic explanations when you can be specific.

4. **At the end of the conversation**, once all prompts have been discussed (or the learner says they're done), generate a **Learning Pack** — a nicely formatted document that includes:
   - **Top Takeaways**: 5-7 key insights from the entire conversation
   - **Things to Note**: Important nuances, caveats, or counterarguments that came up
   - **Further Reading**: 5-10 specific books, papers, articles, or resources to explore next
   - **Conversation Summary**: A concise narrative summary of everything discussed, organized by topic

Format the Learning Pack clearly with headers and bullet points so the learner can save it as a reference document.

---

## About the Learner
- **Name**: ${intake.name || 'Not provided'}
- **Role/Profession**: ${intake.profession}
- **Curiosity**: ${intake.curiosity}
- **Date**: ${date}

---

## Collected Prompts

The learner clicked on these prompts during the presentation. Handle them **one at a time**, in order.\n\n`;

    // Merge slides that have notes but no collected prompts
    Object.keys(customNotes).forEach(slideNum => {
      const n = Number(slideNum);
      if (!grouped[n]) {
        grouped[n] = { title: slideTitles[n - 1], prompts: [] };
      }
    });

    const allSlideNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    const topicsAll = allSlideNumbers.map(n => grouped[n].title).join(', ');

    // Add each prompt grouped by slide, with custom notes
    allSlideNumbers.forEach((slideNum, idx) => {
      const group = grouped[slideNum];
      md += `### ${idx + 1}. Slide ${slideNum}: ${group.title}\n\n`;
      group.prompts.forEach(p => {
        md += `**${p.label}**\n\n`;
        md += `${p.prompt}\n\n`;
      });
      if (customNotes[slideNum]) {
        md += `**Your Notes**\n\n`;
        md += `${customNotes[slideNum]}\n\n`;
      }
      md += `---\n\n`;
    });

    // Meta-prompt at the end
    md += `## Continue the Learning Journey

Once you've worked through all the prompts above, use this meta-prompt to continue:

> I'm ${intake.name || 'a learner'}, a ${intake.profession} who is curious about ${intake.curiosity}. I just went through a presentation on the Economics of AI that covered the full value chain: upstream costs (silicon, data, training, energy, talent), midstream market structure (oligopoly, open source, geopolitics), and downstream impacts (pricing, agentic AI, labor markets, inequality). During the presentation, I explored these specific topics: ${topicsAll}. Based on what I've shown interest in, continue my learning journey. Go deeper on the areas I explored, connect them to each other, and suggest new angles I might not have considered. Frame everything in terms of my profession and my specific curiosity.

---

*Generated from the Economics of AI Interactive Learning Resource*
*Presentation by Ashish Kulkarni — Takshashila Institution, GCPP Program*
`;

    // Download
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `economics-of-ai-prompts-${intake.name ? intake.name.toLowerCase().replace(/\s+/g, '-') : 'learner'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded! Open in any LLM to continue learning.');
  }

  // ── Start ──
  init();
})();
