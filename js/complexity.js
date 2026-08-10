/* 計算量ページ: 成長曲線チャート + クイズ */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  /* ---------- 系列定義 ----------
   * 色は dataviz バリデータで両テーマとも検証済み（ダーク背景 #121a2e / ライト背景 #ffffff、全 6 色 3:1 以上）。
   * 隣接 CVD ΔE が floor band のため、線の右端に直接ラベルを必ず描く（relief rule）。
   */
  var SERIES_COLOR = {
    dark: { c1: "#3987e5", logn: "#199e70", n: "#c98500", nlogn: "#008300", n2: "#9085e9", exp: "#e66767" },
    light: { c1: "#2a78d6", logn: "#1baf7a", n: "#eda100", nlogn: "#008300", n2: "#4a3aa7", exp: "#e34948" },
  };
  var SERIES = [
    { id: "c1", label: "O(1)", fn: function () { return 1; }, on: true },
    { id: "logn", label: "O(log n)", fn: function (n) { return Math.log2(n); }, on: true },
    { id: "n", label: "O(n)", fn: function (n) { return n; }, on: true },
    { id: "nlogn", label: "O(n log n)", fn: function (n) { return n * Math.log2(n); }, on: true },
    { id: "n2", label: "O(n²)", fn: function (n) { return n * n; }, on: true },
    { id: "exp", label: "O(2ⁿ)", fn: function (n) { return Math.pow(2, n); }, on: false },
  ];

  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  /* チャート専用インク（ライト/ダーク双方のサーフェスに合わせて調整） */
  var INK_BY_THEME = {
    dark: { grid: "#1f2b4a", axis: "#35466f", muted: "#8b9cbd", text: "#e9effb" },
    light: { grid: "#e3e8f2", axis: "#c1cce0", muted: "#6b7690", text: "#131a2c" },
  };
  var SURFACE_BY_THEME = { dark: "#121a2e", light: "#ffffff" };

  function ink() {
    return INK_BY_THEME[currentTheme()];
  }
  function surface() {
    return SURFACE_BY_THEME[currentTheme()];
  }
  function seriesColor(id) {
    return SERIES_COLOR[currentTheme()][id];
  }

  var PAD = { left: 56, right: 96, top: 34, bottom: 46 };
  var chart = { nMax: 50, log: false, hoverN: null };

  function visibleSeries() {
    return SERIES.filter(function (s) {
      return s.on;
    });
  }

  /* 値 → y 座標用の変換（対数モードでは log10(v+1)） */
  function transform(v) {
    return chart.log ? Math.log10(v + 1) : v;
  }

  function yMaxValue() {
    var vis = visibleSeries();
    if (vis.length === 0) return 10;
    var values = vis.map(function (s) {
      return s.fn(chart.nMax);
    });
    if (chart.log) return Math.max.apply(null, values);
    /* 線形モード: 指数だけ飛び抜ける場合は「2 番目に大きい系列」を基準に
     * スケールし、はみ出す曲線は上に消えていく（それ自体が学び） */
    var sorted = values.slice().sort(function (a, b) {
      return b - a;
    });
    if (sorted.length >= 2 && sorted[0] > sorted[1] * 50) {
      return sorted[1] * 1.6;
    }
    return sorted[0] * 1.05;
  }

  function fmt(v) {
    if (v >= 1e15) return v.toExponential(1).replace("e+", "×10^");
    if (v >= 10000) return Math.round(v).toLocaleString("ja-JP");
    if (v >= 100) return String(Math.round(v));
    if (v >= 10) return String(Math.round(v * 10) / 10);
    return String(Math.round(v * 100) / 100);
  }

  /* ---------- 描画 ---------- */
  function drawChart() {
    var canvas = $("cx-canvas");
    var dpr = window.devicePixelRatio || 1;
    var cssWidth = canvas.clientWidth || canvas.parentElement.clientWidth;
    var cssHeight = 360;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    var plotW = cssWidth - PAD.left - PAD.right;
    var plotH = cssHeight - PAD.top - PAD.bottom;
    var nMax = chart.nMax;
    var yMax = transform(yMaxValue());
    if (yMax <= 0) yMax = 1;

    function xPos(n) {
      return PAD.left + ((n - 1) / (nMax - 1)) * plotW;
    }
    function yPos(v) {
      return PAD.top + plotH - (transform(v) / yMax) * plotH;
    }

    var theInk = ink();
    ctx.font = "11px 'Segoe UI', sans-serif";

    /* グリッドと y 軸ラベル */
    var gridLines = 5;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (var g = 0; g <= gridLines; g++) {
      var frac = g / gridLines;
      var y = PAD.top + plotH - frac * plotH;
      ctx.strokeStyle = g === 0 ? theInk.axis : theInk.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();
      var raw = frac * yMax;
      var labelValue = chart.log ? Math.pow(10, raw) - 1 : raw;
      ctx.fillStyle = theInk.muted;
      ctx.fillText(fmt(labelValue), PAD.left - 8, y);
    }

    /* x 軸ラベル */
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    var xTicks = 5;
    for (var t = 0; t <= xTicks; t++) {
      var n = 1 + (t / xTicks) * (nMax - 1);
      ctx.fillStyle = theInk.muted;
      ctx.fillText(String(Math.round(n)), xPos(n), PAD.top + plotH + 8);
    }
    ctx.fillText("n（データ件数）→", PAD.left + plotW / 2, PAD.top + plotH + 24);
    ctx.fillStyle = theInk.muted;
    ctx.textAlign = "left";
    ctx.fillText("操作回数 ↑", 6, PAD.top - 24);

    /* 曲線（2px、クリップして枠外は描かない） */
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD.left, PAD.top - 2, plotW, plotH + 4);
    ctx.clip();
    visibleSeries().forEach(function (s) {
      ctx.strokeStyle = seriesColor(s.id);
      ctx.lineWidth = 2;
      ctx.beginPath();
      var started = false;
      for (var px = 0; px <= plotW; px += 2) {
        var nv = 1 + (px / plotW) * (nMax - 1);
        var y = yPos(s.fn(nv));
        if (!started) {
          ctx.moveTo(PAD.left + px, y);
          started = true;
        } else {
          ctx.lineTo(PAD.left + px, y);
        }
      }
      ctx.stroke();
    });
    ctx.restore();

    /* 直接ラベル: 曲線が右端 or 上端から出て行く位置に系列名を描く */
    ctx.textBaseline = "middle";
    var usedLabelYs = [];
    visibleSeries().forEach(function (s) {
      var endY = yPos(s.fn(nMax));
      var labelX;
      var labelY;
      if (endY >= PAD.top - 1) {
        labelX = PAD.left + plotW + 6;
        labelY = Math.max(PAD.top + 6, Math.min(endY, PAD.top + plotH - 6));
        ctx.textAlign = "left";
      } else {
        /* 上に突き抜けた曲線: 突き抜ける x 位置を探してラベルを置く */
        var exitN = nMax;
        for (var nv = 1; nv <= nMax; nv += (nMax - 1) / 200) {
          if (yPos(s.fn(nv)) < PAD.top) {
            exitN = nv;
            break;
          }
        }
        labelX = Math.min(xPos(exitN) + 4, PAD.left + plotW - 30);
        labelY = PAD.top + 8;
        ctx.textAlign = "left";
      }
      /* ラベル同士の重なりをずらす（下端を超えるなら上方向へ折り返す） */
      function collides(y) {
        return usedLabelYs.some(function (uy) {
          return Math.abs(uy - y) < 13;
        });
      }
      while (collides(labelY)) labelY += 13;
      if (labelY > PAD.top + plotH - 2) {
        labelY = Math.min(endY, PAD.top + plotH - 8);
        while (collides(labelY)) labelY -= 13;
      }
      usedLabelYs.push(labelY);
      ctx.fillStyle = seriesColor(s.id);
      ctx.font = "bold 12px 'Segoe UI', sans-serif";
      ctx.fillText(s.label, labelX, labelY);
      ctx.font = "11px 'Segoe UI', sans-serif";
    });

    /* ホバー時のクロスヘア */
    if (chart.hoverN !== null) {
      var hx = xPos(chart.hoverN);
      ctx.strokeStyle = theInk.muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, PAD.top);
      ctx.lineTo(hx, PAD.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      visibleSeries().forEach(function (s) {
        var vy = yPos(s.fn(chart.hoverN));
        if (vy < PAD.top || vy > PAD.top + plotH) return;
        ctx.fillStyle = seriesColor(s.id);
        ctx.beginPath();
        ctx.arc(hx, vy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = surface();
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }

  function renderToggles() {
    var box = $("cx-series-toggles");
    box.textContent = "";
    SERIES.forEach(function (s) {
      var btn = document.createElement("button");
      btn.className = "btn small" + (s.on ? " toggled" : "");
      btn.style.borderLeft = "4px solid " + seriesColor(s.id);
      btn.textContent = s.label;
      btn.setAttribute("aria-pressed", s.on ? "true" : "false");
      btn.addEventListener("click", function () {
        s.on = !s.on;
        renderToggles();
        drawChart();
      });
      box.appendChild(btn);
    });
  }

  function setupHover() {
    var canvas = $("cx-canvas");
    var tooltip = $("cx-tooltip");

    canvas.addEventListener("mousemove", function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var plotW = rect.width - PAD.left - PAD.right;
      if (x < PAD.left || x > PAD.left + plotW || plotW <= 0) {
        chart.hoverN = null;
        tooltip.style.display = "none";
        drawChart();
        return;
      }
      var n = Math.round(1 + ((x - PAD.left) / plotW) * (chart.nMax - 1));
      chart.hoverN = n;
      drawChart();

      var rows = visibleSeries()
        .slice()
        .sort(function (a, b) {
          return b.fn(n) - a.fn(n);
        })
        .map(function (s) {
          return (
            '<div><span style="color:' + seriesColor(s.id) + ';">●</span> ' + s.label + " = <b>" + fmt(s.fn(n)) + "</b></div>"
          );
        })
        .join("");
      tooltip.innerHTML = "<div style='color: var(--text-dim);'>n = " + n + "</div>" + rows;
      tooltip.style.display = "block";
      var tx = x + 16;
      if (tx + tooltip.offsetWidth > rect.width) tx = x - tooltip.offsetWidth - 16;
      tooltip.style.left = tx + "px";
      tooltip.style.top = Math.min(e.clientY - rect.top + 10, rect.height - tooltip.offsetHeight - 6) + "px";
    });
    canvas.addEventListener("mouseleave", function () {
      chart.hoverN = null;
      tooltip.style.display = "none";
      drawChart();
    });
  }

  /* ---------- クイズ ---------- */
  var QUIZ = [
    {
      code: "def f(a):\n    total = 0\n    for x in a:\n        total += x\n    return total",
      options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
      answer: 2,
      explain: "ループが 1 重で、要素数 n に比例した回数だけ回る → O(n)。",
    },
    {
      code: "def f(a):\n    n = len(a)\n    count = 0\n    for i in range(n):\n        for j in range(n):\n            if a[i] == a[j]:\n                count += 1\n    return count",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
      answer: 2,
      explain: "n 回のループの中で n 回のループ → n × n = O(n²)。",
    },
    {
      code: "def f(n):\n    i = 1\n    count = 0\n    while i < n:\n        i = i * 2\n        count += 1\n    return count",
      options: ["O(log n)", "O(n)", "O(n log n)", "O(√n)"],
      answer: 0,
      explain: "i が毎回 2 倍になるので、n に達するまでの回数は log₂ n 回 → O(log n)。二分探索と同じ構造。",
    },
    {
      code: "def f(a, x):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == x: return mid\n        if a[mid] < x: lo = mid + 1\n        else: hi = mid - 1\n    return -1",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      answer: 1,
      explain: "毎回、探索範囲が半分になる二分探索 → O(log n)。",
    },
    {
      code: "def f(a):\n    m = max(a)      # ループ1\n    s = sum(a)      # ループ2\n    return m + s",
      options: ["O(1)", "O(n)", "O(2n) という特別な記法", "O(n²)"],
      answer: 1,
      explain: "n + n = 2n だが、Big-O では定数倍を無視するので O(n)。「直列」のループは足し算、「入れ子」は掛け算。",
    },
    {
      code: "def f(n):\n    if n <= 1:\n        return n\n    return f(n - 1) + f(n - 2)",
      options: ["O(n)", "O(n²)", "O(log n)", "O(2ⁿ)"],
      answer: 3,
      explain: "1 回の呼び出しが 2 回の呼び出しを生む再帰 → 呼び出し回数が指数的に増える O(2ⁿ)。メモ化すれば O(n) に落ちる。",
    },
    {
      code: "def f(a):\n    b = sorted(a)          # 比較ソート\n    for i in range(len(b) - 1):\n        if b[i] == b[i + 1]:\n            return True\n    return False",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      answer: 1,
      explain: "sorted() が O(n log n)、その後のループが O(n)。大きい方が支配するので O(n log n)。",
    },
    {
      code: "def f(d, key):\n    # d は Python の dict（ハッシュテーブル）\n    return d.get(key, None)",
      options: ["O(1)（平均）", "O(log n)", "O(n)", "O(n log n)"],
      answer: 0,
      explain: "ハッシュテーブルの検索は平均 O(1)。データ量に（ほぼ）関係なく一定時間。dict / set が強力な理由。",
    },
    {
      code: "def f(n):\n    count = 0\n    while n > 0:\n        n = n // 10\n        count += 1\n    return count  # 桁数を数える",
      options: ["O(1)", "O(log n)", "O(n)", "O(√n)"],
      answer: 1,
      explain: "n が毎回 1/10 になる。10 で割り続けて 0 になるまでの回数は桁数 = log₁₀ n → O(log n)。「毎回定数分の 1 になる」ループは log。",
    },
    {
      code: "def f(a):\n    n = len(a)\n    count = 0\n    for i in range(n):\n        for j in range(i):   # j は i まで\n            count += 1\n    return count",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
      answer: 2,
      explain: "内側の回数は 0+1+2+…+(n−1) = n(n−1)/2。三角形でも面積は n² に比例 → O(n²)。定数 1/2 は Big-O では消える。",
    },
    {
      code: "def f(a, x):\n    s = set(a)      # ここは O(n)\n    return x in s   # この行の計算量は？",
      options: ["O(1)（平均）", "O(log n)", "O(n)", "O(n²)"],
      answer: 0,
      explain: "set はハッシュテーブルなので in は平均 O(1)。リストの in（線形探索 O(n)）との違いは Two Sum の問題で体感できる。",
    },
    {
      code: "def f(n, memo={}):\n    if n in memo: return memo[n]\n    if n <= 1: return n\n    memo[n] = f(n-1, memo) + f(n-2, memo)\n    return memo[n]",
      options: ["O(log n)", "O(n)", "O(n²)", "O(2ⁿ)"],
      answer: 1,
      explain: "メモ化により各 n は 1 回しか計算されない。呼び出しは合計 O(n) 回 → O(n)。素朴な再帰の O(2ⁿ) がメモ化で激減する（再帰ページで可視化あり）。",
    },
  ];

  var quiz = { idx: 0, score: 0, active: false };

  function startQuiz() {
    quiz.idx = 0;
    quiz.score = 0;
    quiz.active = true;
    $("quiz-score").textContent = "0 / " + QUIZ.length;
    showQuestion();
  }

  function showQuestion() {
    var area = $("quiz-area");
    area.textContent = "";
    if (quiz.idx >= QUIZ.length) {
      var done = document.createElement("div");
      var rate = quiz.score / QUIZ.length;
      var comment = rate === 1 ? "全問正解！Big-O は卒業だ。" : rate >= 0.7 ? "いい調子。間違えた問題の解説を読み返そう。" : "ループの「入れ子は掛け算、直列は足し算」から復習してみよう。";
      done.className = "msg " + (rate >= 0.7 ? "ok" : "info");
      done.textContent = "終了！ スコア " + quiz.score + " / " + QUIZ.length + " — " + comment;
      area.appendChild(done);
      quiz.active = false;
      return;
    }

    var q = QUIZ[quiz.idx];
    var head = document.createElement("p");
    head.style.cssText = "color: var(--text-dim); font-size: 0.9rem; margin: 14px 0 4px;";
    head.textContent = "第 " + (quiz.idx + 1) + " 問 / " + QUIZ.length + " — この関数の時間計算量は？";
    area.appendChild(head);

    var code = document.createElement("div");
    code.className = "code-block";
    code.textContent = q.code;
    area.appendChild(code);

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
        if (correct) quiz.score++;
        $("quiz-score").textContent = quiz.score + " / " + QUIZ.length;
        area.querySelectorAll(".quiz-option").forEach(function (b, bi) {
          b.disabled = true;
          if (bi === q.answer) b.classList.add("correct");
        });
        if (!correct) btn.classList.add("wrong");
        feedback.className = "msg " + (correct ? "ok" : "err");
        feedback.textContent = (correct ? "正解！ " : "不正解。正解は " + q.options[q.answer] + "。") + q.explain;

        var next = document.createElement("button");
        next.className = "btn primary";
        next.style.marginTop = "10px";
        next.textContent = quiz.idx + 1 >= QUIZ.length ? "結果を見る" : "次の問題へ →";
        next.addEventListener("click", function () {
          quiz.idx++;
          showQuestion();
        });
        area.appendChild(next);
      });
      area.appendChild(btn);
    });
    area.appendChild(feedback);
  }

  /* ---------- イベント ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderToggles();
    drawChart();
    setupHover();

    $("cx-n").addEventListener("input", function () {
      chart.nMax = parseInt(this.value, 10);
      $("cx-n-label").textContent = this.value;
      /* n の範囲外を指したままのクロスヘアを消す */
      if (chart.hoverN !== null && chart.hoverN > chart.nMax) {
        chart.hoverN = null;
        $("cx-tooltip").style.display = "none";
      }
      drawChart();
    });
    $("cx-log").addEventListener("change", function () {
      chart.log = this.checked;
      drawChart();
    });
    window.addEventListener("resize", drawChart);
    window.addEventListener("dojo-theme-change", function () {
      renderToggles(); /* 系列ボタンの色見本もテーマの配色に合わせ直す */
      drawChart();
    });
    $("quiz-start-btn").addEventListener("click", startQuiz);
  });
})();
