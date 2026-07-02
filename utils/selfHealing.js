const fs = require("fs");
const path = require("path");
const config = require("@config");
const HealingReport = require("./healingReport");

const { testAttribute: TEST_ATTR } = config.selfHealing;
const ATTR_SELECTOR_RE = new RegExp(`\\[${TEST_ATTR}([*^$~|]?)="([^"]+)"\\]`);

// Interactive verbs let the engine reward same-intent candidates and, crucially,
// penalise opposite actions (e.g. healing "add" onto a "remove" button).
const ACTION_VERBS = new Set([
  "add", "remove", "create", "delete", "save", "cancel", "submit", "confirm",
  "reject", "accept", "close", "open", "show", "hide", "enable", "disable",
  "toggle", "select", "deselect", "check", "uncheck", "expand", "collapse",
  "login", "logout", "search", "filter", "sort", "reset", "clear", "continue",
  "checkout", "finish", "back", "next", "click", "view",
]);

const OPPOSITE_ACTIONS = {
  add: ["remove", "delete"],
  remove: ["add", "create", "restore"],
  create: ["delete", "remove"],
  delete: ["create", "add", "restore"],
  save: ["cancel", "discard"],
  cancel: ["save", "submit", "confirm"],
  submit: ["cancel", "reset"],
  confirm: ["cancel", "reject"],
  accept: ["reject", "cancel"],
  reject: ["accept", "confirm"],
  open: ["close"],
  close: ["open"],
  show: ["hide"],
  hide: ["show"],
  enable: ["disable"],
  disable: ["enable"],
  expand: ["collapse"],
  collapse: ["expand"],
  check: ["uncheck"],
  uncheck: ["check"],
  select: ["deselect"],
  deselect: ["select"],
  login: ["logout"],
  logout: ["login"],
  continue: ["cancel", "back"],
  next: ["back", "previous"],
  back: ["next", "continue"],
};

const TAG_HINTS = {
  button: ["btn", "button", "submit"],
  input: ["input", "field", "textbox", "email", "password", "username", "search"],
  a: ["link", "href", "url"],
};

let _locatorNameMap = null;

// Maps a resolved selector string back to the variable that declared it, so the
// report can show `[LOGIN_BUTTON]` rather than an anonymous selector. Only static
// string properties are indexed; function-based locators are skipped safely.
function getLocatorNameMap() {
  if (_locatorNameMap) return _locatorNameMap;
  _locatorNameMap = new Map();

  const locatorsDir = path.join(__dirname, "..", "locators");
  try {
    for (const file of fs.readdirSync(locatorsDir).filter((f) => f.endsWith(".js"))) {
      const LocatorModule = require(path.join(locatorsDir, file));
      for (const prop of Object.getOwnPropertyNames(LocatorModule)) {
        if (["length", "name", "prototype"].includes(prop)) continue;
        if (typeof LocatorModule[prop] !== "string") continue;
        _locatorNameMap.set(LocatorModule[prop], prop);
      }
    }
  } catch (error) {
    console.warn(`Self-healing: could not build locator name map: ${error.message}`);
  }

  return _locatorNameMap;
}

class SelfHealingLocator {
  constructor(page) {
    this.page = page;
  }

  get threshold() {
    return config.selfHealing.confidenceThreshold;
  }

  parseSelector(selector, locatorName = null) {
    const meta = {
      original: selector,
      locatorName: locatorName || null,
      attrValue: null,
      keywords: [],
      nameKeywords: [],
      primaryVerb: null,
      tagHint: null,
      textHint: null,
      ariaLabel: null,
      placeholder: null,
      role: null,
    };

    const attrMatch = selector.match(ATTR_SELECTOR_RE);
    if (attrMatch) {
      meta.attrValue = attrMatch[2];
      meta.keywords.push(...this._extractKeywords(attrMatch[2]));
    }

    const idMatch = selector.match(/#([A-Za-z][\w-]*)/);
    if (idMatch) meta.keywords.push(...this._extractKeywords(idMatch[1]));

    for (const classMatch of selector.matchAll(/\.([A-Za-z][\w-]*)/g)) {
      meta.keywords.push(...this._extractKeywords(classMatch[1]));
    }

    const ariaMatch = selector.match(/\[aria-label="([^"]+)"\]/);
    if (ariaMatch) {
      meta.ariaLabel = ariaMatch[1];
      meta.keywords.push(...this._extractKeywords(ariaMatch[1]));
    }

    const placeholderMatch = selector.match(/\[placeholder="([^"]+)"\]/);
    if (placeholderMatch) {
      meta.placeholder = placeholderMatch[1];
      meta.keywords.push(...this._extractKeywords(placeholderMatch[1]));
    }

    const textMatch = selector.match(/:has-text\("([^"]+)"\)/) || selector.match(/:text\("([^"]+)"\)/);
    if (textMatch) {
      meta.textHint = textMatch[1];
      meta.keywords.push(...this._extractKeywords(textMatch[1]));
    }

    const roleMatch = selector.match(/\[role="([^"]+)"\]/);
    if (roleMatch) meta.role = roleMatch[1];

    meta.tagHint = this._inferTagType(selector, meta);
    meta.primaryVerb = this._extractPrimaryVerb(meta.keywords);
    meta.keywords = [...new Set(meta.keywords)];

    if (meta.locatorName) {
      meta.nameKeywords = this._extractKeywords(meta.locatorName);
      meta.primaryVerb = meta.primaryVerb || this._extractPrimaryVerb(meta.nameKeywords);
      meta.tagHint =
        meta.tagHint || this._inferTagType("", { ...meta, keywords: meta.nameKeywords });
      meta.keywords = [...new Set([...meta.keywords, ...meta.nameKeywords])];
    }

    return meta;
  }

  _extractKeywords(value) {
    if (!value) return [];
    return value
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase()
      .split(/[-_\s]+/)
      .filter((k) => k.length > 1);
  }

  _extractPrimaryVerb(keywords) {
    return keywords.find((k) => ACTION_VERBS.has(k)) || null;
  }

  _oppositeVerbs(verb) {
    return OPPOSITE_ACTIONS[verb] || [];
  }

  _inferTagType(selector, meta) {
    const tagMatch = selector.match(/^(\w+)[[.#:\s]/);
    const knownTags = ["button", "input", "a", "select", "textarea", "label", "img"];
    if (tagMatch && knownTags.includes(tagMatch[1])) return tagMatch[1];

    for (const [tag, hints] of Object.entries(TAG_HINTS)) {
      if (meta.keywords.some((k) => hints.includes(k))) return tag;
    }

    if (meta.role === "button" || meta.role === "menuitem") return "button";
    if (meta.role === "textbox") return "input";
    if (meta.role === "link") return "a";
    return null;
  }

  _keywordSequenceScore(originalKeywords, candidateKeywords) {
    if (!originalKeywords.length || !candidateKeywords.length) return 0;
    let matched = 0;
    let lastIndex = -1;
    for (const keyword of originalKeywords) {
      const idx = candidateKeywords.indexOf(keyword, lastIndex + 1);
      if (idx > lastIndex) {
        matched++;
        lastIndex = idx;
      }
    }
    return matched / originalKeywords.length;
  }

  _stringOverlap(str1, str2) {
    if (!str1 || !str2) return 0;
    const toSet = (s) =>
      new Set(s.toLowerCase().split(/[-_\s]+/).filter((w) => w.length > 1));
    const words1 = toSet(str1);
    const words2 = toSet(str2);
    if (!words1.size || !words2.size) return 0;
    let matches = 0;
    for (const word of words1) if (words2.has(word)) matches++;
    return matches / Math.max(words1.size, words2.size);
  }

  async _getElementInfo(element) {
    try {
      return await element.evaluate((el, attr) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          attrValue: el.getAttribute(attr),
          text: (el.textContent || "").trim().substring(0, 100),
          role: el.getAttribute("role") || el.tagName.toLowerCase(),
          ariaLabel: el.getAttribute("aria-label"),
          placeholder: el.getAttribute("placeholder"),
          id: el.id,
          visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
          boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      }, TEST_ATTR);
    } catch {
      return { tag: "unknown", visible: false };
    }
  }

  _scoreCandidate(info, meta) {
    let score = 0;
    const reasons = [];

    if (info.attrValue && meta.keywords.length) {
      const sequence = this._keywordSequenceScore(
        meta.keywords,
        this._extractKeywords(info.attrValue)
      );
      score += sequence * 0.3;
      if (sequence > 0.5) reasons.push(`keyword-sequence:${sequence.toFixed(2)}`);
    }

    if (meta.primaryVerb) {
      const candidateVerb = this._extractPrimaryVerb(
        this._extractKeywords(info.attrValue || info.text || "")
      );
      if (candidateVerb === meta.primaryVerb) {
        score += 0.25;
        reasons.push(`verb-match:${meta.primaryVerb}`);
      } else if (candidateVerb && this._oppositeVerbs(meta.primaryVerb).includes(candidateVerb)) {
        score -= 0.5;
        reasons.push(`opposite-verb:${candidateVerb}-vs-${meta.primaryVerb}`);
      }
    }

    if (meta.attrValue && info.attrValue) {
      const overlap = this._stringOverlap(meta.attrValue, info.attrValue);
      score += overlap * 0.2;
      if (overlap > 0.3) reasons.push(`attr-overlap:${overlap.toFixed(2)}`);
    }

    if (meta.textHint && info.text) {
      const overlap = this._stringOverlap(meta.textHint, info.text);
      score += overlap * 0.15;
      if (overlap > 0.3) reasons.push(`text-match:${overlap.toFixed(2)}`);
    }

    if (meta.tagHint && info.tag === meta.tagHint) {
      score += 0.1;
      reasons.push(`tag-match:${info.tag}`);
    }

    if (meta.role && info.role === meta.role) {
      score += 0.1;
      reasons.push(`role-match:${info.role}`);
    }

    if (info.visible) {
      score += 0.1;
      reasons.push("visible");
    }

    return { score: Math.max(score, 0), reasons };
  }

  _attrSelector(value) {
    return `[${TEST_ATTR}="${value}"]`;
  }

  async _collectFromLocator(locator, meta, strategy, candidates) {
    try {
      const count = await locator.count();
      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = locator.nth(i);
        try {
          if (!(await element.isVisible())) continue;
          const info = await this._getElementInfo(element);
          const { score, reasons } = this._scoreCandidate(info, meta);
          const uniquenessBonus = count === 1 ? 0.1 : 0;
          const finalScore = Math.min(score + uniquenessBonus, 1);
          if (finalScore > 0.3) {
            candidates.push({
              element,
              selector: info.attrValue ? this._attrSelector(info.attrValue) : strategy,
              confidence: finalScore,
              strategy,
              reasons,
              elementInfo: info,
            });
          }
        } catch {
          /* stale element */
        }
      }
    } catch {
      /* invalid locator */
    }
  }

  // Tier 1: relaxed attribute matching — loosen the original data-test selector.
  async tryRelaxedAttribute(meta, ctx) {
    if (!meta.attrValue) return [];

    const value = meta.attrValue;
    const variants = [
      `[${TEST_ATTR}*="${value}"]`,
      `[${TEST_ATTR}^="${value}"]`,
      `[${TEST_ATTR}$="${value}"]`,
    ];

    const strongKeywords = meta.keywords.filter((k) => k.length > 2);
    if (strongKeywords.length >= 2) {
      variants.push(strongKeywords.map((k) => `[${TEST_ATTR}*="${k}"]`).join(""));
    }

    if (meta.primaryVerb) {
      for (const keyword of strongKeywords) {
        if (keyword !== meta.primaryVerb) {
          variants.push(`[${TEST_ATTR}*="${meta.primaryVerb}"][${TEST_ATTR}*="${keyword}"]`);
        }
      }
    }

    const candidates = [];
    await Promise.all(
      [...new Set(variants)].map((variant) =>
        this._collectFromLocator(ctx.locator(variant), meta, "relaxedAttribute", candidates)
      )
    );
    return candidates;
  }

  // Tier 2: semantic Playwright locators derived from selector + name intent.
  async trySemanticLocators(meta, ctx) {
    const meaningful = meta.keywords.filter((k) => k.length > 2 && !ACTION_VERBS.has(k));
    const pattern = [meta.primaryVerb || "", meaningful.join(".*")].filter(Boolean).join(".*");

    if (!pattern && !meta.textHint && !meta.ariaLabel && !meta.placeholder) return [];

    const factories = [];
    if (pattern) {
      const regex = new RegExp(pattern, "i");
      if (!meta.tagHint || meta.tagHint === "button") {
        factories.push({ label: "semantic-button", fn: () => ctx.getByRole("button", { name: regex }) });
      }
      if (!meta.tagHint || meta.tagHint === "a") {
        factories.push({ label: "semantic-link", fn: () => ctx.getByRole("link", { name: regex }) });
      }
      if (!meta.tagHint || meta.tagHint === "input") {
        factories.push({ label: "semantic-textbox", fn: () => ctx.getByRole("textbox", { name: regex }) });
      }
    }
    if (meta.textHint) {
      factories.push({ label: "semantic-text", fn: () => ctx.getByText(meta.textHint, { exact: false }) });
    }
    if (meta.ariaLabel) {
      factories.push({ label: "semantic-label", fn: () => ctx.getByLabel(meta.ariaLabel, { exact: false }) });
    }
    if (meta.placeholder) {
      factories.push({ label: "semantic-placeholder", fn: () => ctx.getByPlaceholder(meta.placeholder, { exact: false }) });
    }

    const candidates = [];
    await Promise.all(
      factories.map(({ fn, label }) => {
        try {
          return this._collectFromLocator(fn(), meta, label, candidates);
        } catch {
          return Promise.resolve();
        }
      })
    );
    return candidates;
  }

  // Tier 3: DOM similarity scan — score visible interactive elements in-page.
  async tryDomSimilarityScan(meta, ctx) {
    const evaluateTarget = typeof ctx.evaluate === "function" ? ctx : this.page;
    const candidates = [];

    let infos = [];
    try {
      infos = await evaluateTarget.evaluate(
        ({ keywords, tagHint, attr }) => {
          const results = [];
          for (const el of document.querySelectorAll("*")) {
            if (!el.offsetWidth && !el.offsetHeight && !el.getClientRects().length) continue;

            const attrValue = el.getAttribute(attr);
            const interactive =
              ["BUTTON", "INPUT", "A", "SELECT", "TEXTAREA"].includes(el.tagName) ||
              el.getAttribute("role") ||
              attrValue ||
              el.getAttribute("aria-label");
            if (!interactive) continue;

            const tag = el.tagName.toLowerCase();
            const text = (el.textContent || "").trim().substring(0, 100);
            let relevance = 0;

            if (attrValue && keywords.length) {
              const words = attrValue.toLowerCase().split(/[-_]+/);
              relevance += (keywords.filter((k) => words.includes(k)).length / keywords.length) * 3;
            }
            if (text && keywords.length) {
              const lower = text.toLowerCase();
              relevance += keywords.filter((k) => lower.includes(k)).length / keywords.length;
            }
            if (tagHint && tag === tagHint) relevance += 0.5;

            if (relevance > 0.5) {
              const rect = el.getBoundingClientRect();
              results.push({
                tag,
                attrValue,
                text,
                role: el.getAttribute("role") || tag,
                ariaLabel: el.getAttribute("aria-label"),
                placeholder: el.getAttribute("placeholder"),
                id: el.id,
                visible: true,
                boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                relevance,
              });
            }
          }
          return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
        },
        { keywords: meta.keywords, tagHint: meta.tagHint, attr: TEST_ATTR }
      );
    } catch (error) {
      console.log(`Self-healing DOM scan skipped: ${error.message}`);
      return candidates;
    }

    for (const info of infos) {
      const { score, reasons } = this._scoreCandidate(info, meta);
      let resolvedSelector;
      if (info.attrValue) resolvedSelector = this._attrSelector(info.attrValue);
      else if (info.id) resolvedSelector = `#${info.id}`;
      else continue;

      const element = ctx.locator(resolvedSelector).first();
      try {
        if (!(await element.isVisible())) continue;
      } catch {
        continue;
      }

      if (score > 0.3) {
        candidates.push({ element, selector: resolvedSelector, confidence: score, strategy: "domScan", reasons, elementInfo: info });
      }
    }
    return candidates;
  }

  // Tier 4: AI-assisted healing — gated behind an API key, skipped gracefully.
  async tryAiHealing(meta, ctx, priorCandidates) {
    const { apiKey, aiProvider, aiModel } = config.selfHealing;
    if (!apiKey) return [];

    const candidates = [];
    try {
      const evaluateTarget = typeof ctx.evaluate === "function" ? ctx : this.page;
      const domSnapshot = await evaluateTarget.evaluate(() => {
        const clone = document.body.cloneNode(true);
        clone.querySelectorAll("script, style, noscript, svg, path").forEach((el) => el.remove());
        let html = clone.innerHTML;
        if (html.length > 8000) html = `${html.substring(0, 8000)}\n... (truncated)`;
        return html;
      });

      const priorContext = priorCandidates
        .filter((c) => c.confidence > 0.3)
        .map((c) => `- ${c.selector} (confidence: ${c.confidence.toFixed(2)}, strategy: ${c.strategy})`)
        .join("\n");

      const prompt = [
        "You are a Playwright automation expert. A CSS selector broke and needs a replacement.",
        "",
        `Original selector: ${meta.original}`,
        meta.locatorName ? `Locator variable name: ${meta.locatorName} (describes the element's purpose)` : "",
        `Keywords: ${meta.keywords.join(", ") || "none"}`,
        `Primary action: ${meta.primaryVerb || "unknown"}`,
        `Expected element type: ${meta.tagHint || "unknown"}`,
        priorContext ? `\nOther strategies suggested:\n${priorContext}` : "",
        "",
        "Page DOM (trimmed):",
        domSnapshot,
        "",
        `Return ONLY JSON: { "selector": "...", "confidence": 0.0-1.0, "reasoning": "..." }`,
        `Rules: prefer ${TEST_ATTR} attributes, only visible elements, never suggest opposite actions.`,
      ]
        .filter((line) => line !== "")
        .join("\n");

      const aiContent = await this._callAiProvider(aiProvider, aiModel, apiKey, prompt);
      if (!aiContent) return candidates;

      const jsonMatch = aiContent.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) return candidates;

      const result = JSON.parse(jsonMatch[0]);
      if (!result.selector || result.confidence < 0.3) return candidates;

      const element = ctx.locator(result.selector).first();
      if (!(await element.isVisible())) return candidates;

      const info = await this._getElementInfo(element);
      const { score, reasons } = this._scoreCandidate(info, meta);
      candidates.push({
        element,
        selector: result.selector,
        confidence: Math.max(score, result.confidence * 0.9),
        strategy: "ai",
        reasons: [...reasons, `ai:${result.reasoning || "none"}`],
        elementInfo: info,
      });
    } catch (error) {
      console.log(`Self-healing AI error: ${error.message}`);
    }
    return candidates;
  }

  async _callAiProvider(provider, model, apiKey, prompt) {
    if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-3-5-haiku-20241022",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.content?.[0]?.text;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  }

  _isSameElement(a, b) {
    if (!a || !b) return false;
    if (a.attrValue && a.attrValue === b.attrValue) return true;
    if (a.id && a.id === b.id) return true;
    if (a.boundingBox && b.boundingBox) {
      const dx = Math.abs((a.boundingBox.x || 0) - (b.boundingBox.x || 0));
      const dy = Math.abs((a.boundingBox.y || 0) - (b.boundingBox.y || 0));
      if (dx < 5 && dy < 5) return true;
    }
    return false;
  }

  // Consensus engine: group candidates by same underlying element, then vote.
  // Agreement across independent tiers earns a confidence bonus.
  _findConsensus(allCandidates) {
    if (!allCandidates.length) return { candidate: null, votes: 0, confidence: 0, secondGroup: null };

    const groups = [];
    for (const candidate of allCandidates) {
      const group = groups.find((g) => this._isSameElement(candidate.elementInfo, g[0].elementInfo));
      if (group) group.push(candidate);
      else groups.push([candidate]);
    }

    groups.sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return Math.max(...b.map((c) => c.confidence)) - Math.max(...a.map((c) => c.confidence));
    });

    const bestGroup = groups[0];
    const votes = bestGroup.length;
    const best = bestGroup.reduce((top, c) => (c.confidence > top.confidence ? c : top), bestGroup[0]);
    const confidence = Math.min(best.confidence + (votes - 1) * 0.1, 1);

    return {
      candidate: { ...best, confidence, consensusVotes: votes },
      votes,
      confidence,
      secondGroup: groups.length > 1 ? groups[1] : null,
    };
  }

  _isAmbiguous(consensus) {
    if (!consensus.secondGroup) return false;
    const runnerUp = consensus.secondGroup.reduce(
      (top, c) => (c.confidence > top.confidence ? c : top),
      consensus.secondGroup[0]
    );
    const runnerUpConfidence = Math.min(
      runnerUp.confidence + (consensus.secondGroup.length - 1) * 0.1,
      1
    );
    return Math.abs(consensus.confidence - runnerUpConfidence) < 0.1;
  }

  async heal(originalSelector, context) {
    if (!config.selfHealing.enabled) return null;

    const startTime = Date.now();
    const ctx = context || this.page;
    const locatorName = getLocatorNameMap().get(originalSelector) || null;
    const mode = config.selfHealing.mode;
    const meta = this.parseSelector(originalSelector, locatorName);
    const threshold = this.threshold;

    const nameTag = locatorName ? ` [${locatorName}]` : "";
    console.log(`\nSelf-Healing Report:${nameTag} original selector "${originalSelector}"`);

    try {
      let candidates = [];
      if (mode === "algorithmic" || mode === "both") {
        const [tier1, tier2, tier3] = await Promise.all([
          this.tryRelaxedAttribute(meta, ctx).catch(() => []),
          this.trySemanticLocators(meta, ctx).catch(() => []),
          this.tryDomSimilarityScan(meta, ctx).catch(() => []),
        ]);
        candidates = [...tier1, ...tier2, ...tier3];
      }

      this._logCandidates("Tier 1-3 (algorithmic)", candidates);

      let consensus = this._findConsensus(candidates);
      if (
        consensus.votes >= 2 &&
        consensus.confidence >= threshold + 0.1 &&
        !this._isAmbiguous(consensus)
      ) {
        return this._accept(originalSelector, consensus.candidate, startTime, false, locatorName);
      }

      let aiCandidates = [];
      if (mode === "ai" || mode === "both") {
        aiCandidates = await this.tryAiHealing(meta, ctx, candidates).catch(() => []);
        this._logCandidates("Tier 4 (AI)", aiCandidates);
      }

      candidates = [...candidates, ...aiCandidates];
      consensus = this._findConsensus(candidates);

      if (consensus.candidate && consensus.confidence >= threshold) {
        return this._accept(
          originalSelector,
          consensus.candidate,
          startTime,
          aiCandidates.length > 0,
          locatorName
        );
      }

      console.log(
        `No confident candidate (best: ${consensus.confidence.toFixed(2)}, threshold: ${threshold})`
      );
      return null;
    } catch (error) {
      console.log(`Self-healing error: ${error.message}`);
      return null;
    }
  }

  _logCandidates(label, candidates) {
    if (!candidates.length) {
      console.log(`  ${label}: no candidates`);
      return;
    }
    console.log(`  ${label}:`);
    [...candidates]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .forEach((c, i) => {
        console.log(`    ${i + 1}. ${c.selector} (confidence: ${c.confidence.toFixed(2)}, strategy: ${c.strategy})`);
      });
  }

  _accept(originalSelector, candidate, startTime, aiUsed, locatorName) {
    const elapsed = Date.now() - startTime;
    const votes = candidate.consensusVotes || 1;

    HealingReport.addEvent({
      originalSelector,
      locatorName: locatorName || "unknown",
      healedSelector: candidate.selector,
      strategy: candidate.strategy,
      baseConfidence: candidate.confidence - (votes - 1) * 0.1,
      finalConfidence: candidate.confidence,
      consensusVotes: votes,
      aiUsed,
      healingTimeMs: elapsed,
      reasons: candidate.reasons,
      timestamp: new Date().toISOString(),
    });

    const nameTag = locatorName ? ` [${locatorName}]` : "";
    console.log(
      `SELF-HEALED:${nameTag} "${originalSelector}" -> "${candidate.selector}" ` +
        `(confidence: ${candidate.confidence.toFixed(2)}, votes: ${votes}, ` +
        `strategy: ${candidate.strategy}, time: ${elapsed}ms)`
    );

    return candidate;
  }
}

module.exports = SelfHealingLocator;
