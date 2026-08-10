/* 共通: ヘッダーナビゲーションの生成とアクティブ表示 */
(function () {
  "use strict";

  /* おすすめの学習順に並べる（トップページのカードと同じ順序）。
     まず遊んで「速さの違い」を体感（二分探索・ソート）→ その体験に
     名前をつける（計算量）→ 道具と応用へ、という初学者向けの流れ。 */
  var PAGES = [
    { href: "index.html", label: "ホーム" },
    { href: "search.html", label: "二分探索" },
    { href: "sorting.html", label: "ソート" },
    { href: "complexity.html", label: "計算量" },
    { href: "datastructure.html", label: "データ構造" },
    { href: "recursion.html", label: "再帰" },
    { href: "dp.html", label: "DP" },
    { href: "strings.html", label: "文字列探索" },
    { href: "pathfinding.html", label: "経路探索" },
    { href: "python.html", label: "Python実践" },
  ];

  function currentPage() {
    var path = location.pathname.split("/").pop();
    return path === "" ? "index.html" : path;
  }

  /* ============ テーマ切り替え（既定はライト） ============ */
  var THEME_KEY = "dojo-theme";
  var THEME_COLOR = { light: "#f2f4f9", dark: "#0a0e18" };

  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
    /* キャンバス等、CSS変数を直接読んで自前描画しているモジュールに通知 */
    window.dispatchEvent(new CustomEvent("dojo-theme-change", { detail: { theme: theme } }));
  }

  function setTheme(theme, persist) {
    applyTheme(theme);
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        /* プライベートブラウズ等では保存できないが致命的ではない */
      }
    }
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      var toDark = theme !== "dark";
      btn.innerHTML = '<span class="ico ' + (toDark ? "ico-moon" : "ico-sun") + '"></span>';
      btn.setAttribute("aria-label", toDark ? "ダークテーマに切り替え" : "ライトテーマに切り替え");
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function buildHeader() {
    var header = document.createElement("header");
    header.className = "site-header";

    var inner = document.createElement("div");
    inner.className = "inner";

    var logo = document.createElement("a");
    logo.className = "logo";
    logo.href = "index.html";
    logo.innerHTML = '<span class="ico ico-brand"></span>アルゴリズム<span class="hl">道場</span>';
    inner.appendChild(logo);

    var nav = document.createElement("nav");
    var current = currentPage();
    PAGES.forEach(function (p) {
      var a = document.createElement("a");
      a.href = p.href;
      a.textContent = p.label;
      if (p.href === current) a.className = "active";
      nav.appendChild(a);
    });
    inner.appendChild(nav);

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    toggle.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
    inner.appendChild(toggle);

    header.appendChild(inner);
    document.body.insertBefore(header, document.body.firstChild);
    setTheme(currentTheme(), false); /* トグルの見た目を今の状態に合わせる */
  }

  function buildFooter() {
    var footer = document.createElement("footer");
    footer.className = "site-footer";
    var logo = document.createElement("div");
    logo.className = "foot-logo";
    logo.innerHTML = '<span class="ico ico-brand"></span>アルゴリズム道場';
    var line = document.createElement("div");
    line.textContent = "手を動かして学ぶアルゴリズム入門 — 可視化 · ゲーム · クイズ · Python 実践";
    footer.appendChild(logo);
    footer.appendChild(line);
    document.body.appendChild(footer);
  }

  /* ============ 前へ / 次へ ページャー（学習順ナビ） ============ */
  function buildPager() {
    var current = currentPage();
    var idx = -1;
    for (var i = 0; i < PAGES.length; i++) {
      if (PAGES[i].href === current) idx = i;
    }
    /* ホームと未知のページには出さない */
    if (idx <= 0) return;
    var main = document.querySelector("main.container");
    if (!main) return;

    var pager = document.createElement("nav");
    pager.className = "pager";
    pager.setAttribute("aria-label", "学習順ナビゲーション");

    function makeLink(page, stepNo, isNext) {
      var a = document.createElement("a");
      a.className = "pager-link" + (isNext ? " next" : "");
      a.href = page.href;
      var dir = document.createElement("span");
      dir.className = "dir";
      dir.innerHTML = isNext
        ? '次のステップ<span class="ico ico-arrow-right"></span>'
        : '<span class="ico ico-arrow-left"></span>前のステップ';
      var label = document.createElement("span");
      label.className = "dest";
      label.textContent = (stepNo > 0 ? "STEP " + stepNo + ": " : "") + page.label;
      a.appendChild(dir);
      a.appendChild(label);
      return a;
    }

    if (idx > 1) {
      pager.appendChild(makeLink(PAGES[idx - 1], idx - 1, false));
    } else {
      pager.appendChild(makeLink(PAGES[0], 0, false)); /* STEP1 の前はホーム */
    }
    if (idx < PAGES.length - 1) {
      pager.appendChild(makeLink(PAGES[idx + 1], idx + 1, true));
    } else {
      var done = document.createElement("span");
      done.className = "pager-link done";
      done.innerHTML = '<span class="dir"><span class="ico ico-check"></span>最終ステップ</span><span class="dest">全モジュール制覇まであと少し</span>';
      pager.appendChild(done);
    }
    main.appendChild(pager);
  }

  /* ============ 汎用クイズエンジン（理解度チェック用） ============
   * questions: [{ q, code?, options: [..], answer: 正解のindex, explain }]
   * ids: { start: 開始ボタン, area: 描画先, score: スコア表示の <b> }
   */
  function mountQuiz(ids, questions) {
    var startBtn = document.getElementById(ids.start);
    var area = document.getElementById(ids.area);
    var scoreEl = document.getElementById(ids.score);
    if (!startBtn || !area || !scoreEl) return;

    var state = { idx: 0, score: 0 };

    function showQuestion() {
      area.textContent = "";
      if (state.idx >= questions.length) {
        var done = document.createElement("div");
        var rate = state.score / questions.length;
        done.className = "msg " + (rate >= 0.7 ? "ok" : "info");
        done.textContent =
          "終了！ スコア " + state.score + " / " + questions.length + " — " +
          (rate === 1 ? "全問正解。次のステップへ進もう。" : rate >= 0.7 ? "いい理解度。間違えた問題の解説だけ読み返そう。" : "もう一度上のパネルで手を動かしてから再挑戦してみよう。");
        area.appendChild(done);
        return;
      }
      var q = questions[state.idx];

      var head = document.createElement("p");
      head.style.cssText = "color: var(--text-dim); font-size: 0.9rem; margin: 14px 0 4px;";
      head.textContent = "第 " + (state.idx + 1) + " 問 / " + questions.length + " — " + q.q;
      area.appendChild(head);

      if (q.code) {
        var code = document.createElement("div");
        code.className = "code-block";
        code.textContent = q.code;
        area.appendChild(code);
      }

      var feedback = document.createElement("div");
      var answered = false;
      q.options.forEach(function (opt, i) {
        var btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.textContent = opt;
        btn.addEventListener("click", function () {
          if (answered) return;
          answered = true;
          var correct = i === q.answer;
          if (correct) state.score++;
          scoreEl.textContent = state.score + " / " + questions.length;
          area.querySelectorAll(".quiz-option").forEach(function (b, bi) {
            b.disabled = true;
            if (bi === q.answer) b.classList.add("correct");
          });
          if (!correct) btn.classList.add("wrong");
          feedback.className = "msg " + (correct ? "ok" : "err");
          feedback.textContent = (correct ? "正解！ " : "不正解。正解は「" + q.options[q.answer] + "」。") + q.explain;

          var next = document.createElement("button");
          next.className = "btn primary";
          next.style.marginTop = "10px";
          next.textContent = state.idx + 1 >= questions.length ? "結果を見る" : "次の問題へ →";
          next.addEventListener("click", function () {
            state.idx++;
            showQuestion();
          });
          area.appendChild(next);
        });
        area.appendChild(btn);
      });
      area.appendChild(feedback);
    }

    startBtn.addEventListener("click", function () {
      state.idx = 0;
      state.score = 0;
      scoreEl.textContent = "0 / " + questions.length;
      showQuestion();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildPager();
    buildFooter();
  });

  /* 各ページ共通の小道具 */
  window.Dojo = {
    /* min〜max の整数乱数（両端含む） */
    randInt: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    /* 配列シャッフル（Fisher–Yates、新しい配列を返す） */
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    },
    clamp: function (v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    },
    mountQuiz: mountQuiz,
  };
})();
