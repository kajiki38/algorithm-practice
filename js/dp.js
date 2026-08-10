/* 動的計画法ページ: コイン両替（1次元DP）+ 0/1ナップサック（2次元DP） */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  function setMsg(id, text, cls) {
    var el = $(id);
    el.className = "msg " + cls;
    el.textContent = text;
  }

  /* ================= コイン両替 ================= */
  var COINS = [1, 3, 4];
  var coin = {
    amount: 11,
    res: null,
    filled: 1, /* 確定済みセル数（dp[0] は最初から確定） */
    timer: null,
    quizTarget: -1,
  };

  function coinStop() {
    if (coin.timer) {
      clearInterval(coin.timer);
      coin.timer = null;
    }
  }

  function coinReset() {
    coinStop();
    coin.amount = parseInt($("coin-amount").value, 10);
    coin.res = Algo.coinChangeSteps(COINS, coin.amount);
    coin.filled = 1;
    coin.quizTarget = -1;
    $("coin-quiz-row").style.display = "none";
    setMsg("coin-msg", "「1マス埋める」で dp[1] から順に埋めていこう。dp[0] = 0（0 円は 0 枚で作れる）はタダで手に入る出発点。", "info");
    renderCoins(null);
  }

  /*
   * highlight: { active: i, refs: [index...] } 直近に埋めたセルと参照元
   */
  function renderCoins(highlight) {
    var box = $("coin-cells");
    box.textContent = "";
    for (var i = 0; i <= coin.amount; i++) {
      var cell = document.createElement("div");
      cell.className = "dp-cell";
      var idx = document.createElement("span");
      idx.className = "idx";
      idx.textContent = i + "円";
      var val = document.createElement("span");
      if (i === coin.quizTarget) {
        cell.classList.add("quiz");
        val.textContent = "?";
      } else if (i < coin.filled) {
        cell.classList.add("done");
        val.textContent = coin.res.dp[i] === Infinity ? "×" : String(coin.res.dp[i]);
      } else {
        val.textContent = "";
      }
      if (highlight) {
        if (highlight.active === i) cell.classList.add("active");
        if (highlight.refs && highlight.refs.indexOf(i) !== -1) cell.classList.add("ref");
        if (highlight.trace && highlight.trace.indexOf(i) !== -1) cell.classList.add("trace");
      }
      cell.appendChild(idx);
      cell.appendChild(val);
      box.appendChild(cell);
    }
  }

  function coinFormula(step) {
    if (step.candidates.length === 0) return "作れない";
    var parts = step.candidates.map(function (c) {
      return "dp[" + step.i + "−" + c.coin + "]+1=" + c.value;
    });
    return "min(" + parts.join(", ") + ") = " + step.value;
  }

  function coinTraceback() {
    var used = [];
    var trace = [coin.amount];
    var cur = coin.amount;
    while (cur > 0 && coin.res.pick[cur] !== -1) {
      used.push(coin.res.pick[cur]);
      cur -= coin.res.pick[cur];
      trace.push(cur);
    }
    used.sort(function (a, b) {
      return b - a;
    });
    renderCoins({ trace: trace });
    setMsg(
      "coin-msg",
      "完成。dp[" + coin.amount + "] = " + coin.res.dp[coin.amount] + " 枚（" + coin.amount + " = " + used.join(" + ") + "）。緑のセルは「どのコインを使ったか」を逆にたどった跡。",
      "ok"
    );
  }

  function coinStep() {
    if (coin.quizTarget !== -1) return; /* クイズ回答待ち */
    if (coin.filled > coin.amount) {
      coinTraceback();
      return;
    }
    var i = coin.filled;
    var step = coin.res.steps[i - 1];
    coin.filled++;
    renderCoins({
      active: i,
      refs: step.candidates.map(function (c) {
        return c.from;
      }),
    });
    setMsg("coin-msg", "dp[" + i + "] = " + coinFormula(step) + "。青いセル＝参照した確定済みの答え。", "info");
    if (coin.filled > coin.amount) {
      setTimeout(function () {
        if (coin.filled > coin.amount && !coin.timer) coinTraceback();
      }, 900);
    }
  }

  function coinAuto() {
    if (coin.filled > coin.amount) coinReset();
    coinStop();
    coin.timer = setInterval(function () {
      if (coin.quizTarget !== -1) return;
      if (coin.filled > coin.amount) {
        coinStop();
        coinTraceback();
        return;
      }
      coinStep();
    }, 550);
  }

  function coinQuiz() {
    coinStop();
    if (coin.filled > coin.amount) coinReset();
    /* いま埋まっていないセルからランダムに選び、その直前まで埋める */
    var target = Math.max(coin.filled, Dojo.randInt(Math.min(coin.filled + 1, coin.amount), coin.amount));
    coin.filled = target; /* dp[0..target-1] を確定表示 */
    coin.quizTarget = target;
    renderCoins(null);
    $("coin-quiz-row").style.display = "";
    $("coin-quiz-target").textContent = String(target);
    $("coin-quiz-input").value = "";
    $("coin-quiz-input").focus();
    setMsg("coin-msg", "紫のセル dp[" + target + "] の値を予想しよう。ヒント: dp[" + target + "−1], dp[" + target + "−3], dp[" + target + "−4] の最小 + 1。", "info");
  }

  function coinQuizSubmit() {
    if (coin.quizTarget === -1) return;
    var guess = parseInt($("coin-quiz-input").value, 10);
    if (isNaN(guess)) return;
    var target = coin.quizTarget;
    var correct = coin.res.dp[target];
    var step = coin.res.steps[target - 1];
    coin.quizTarget = -1;
    coin.filled = target + 1;
    $("coin-quiz-row").style.display = "none";
    renderCoins({
      active: target,
      refs: step.candidates.map(function (c) {
        return c.from;
      }),
    });
    setMsg(
      "coin-msg",
      (guess === correct ? "正解。" : "不正解（予想 " + guess + "）。") + " dp[" + target + "] = " + coinFormula(step) + "。",
      guess === correct ? "ok" : "err"
    );
  }

  /* ================= ナップサック ================= */
  var ITEMS = [
    { name: "水筒", w: 3, v: 5 },
    { name: "本", w: 2, v: 3 },
    { name: "カメラ", w: 4, v: 6 },
    { name: "弁当", w: 5, v: 8 },
  ];
  var CAPACITY = 8;

  var knap = {
    res: Algo.knapsackSteps(ITEMS, CAPACITY),
    stepIdx: 0, /* 消化済みステップ数（1ステップ = 1マス） */
    timer: null,
  };

  function knapStop() {
    if (knap.timer) {
      clearInterval(knap.timer);
      knap.timer = null;
    }
  }

  function knapReset() {
    knapStop();
    knap.stepIdx = 0;
    setMsg("knap-msg", "左上から 1 マスずつ。まず「品物なし」の行はぜんぶ 0。", "info");
    renderKnap(null);
  }

  function renderItems() {
    var box = $("knap-items");
    box.textContent = "";
    var label = document.createElement("span");
    label.style.cssText = "font-size: 0.85rem; color: var(--text-dim);";
    label.textContent = "品物:";
    box.appendChild(label);
    ITEMS.forEach(function (it, idx) {
      var chip = document.createElement("span");
      chip.className = "stat-chip";
      chip.id = "knap-item-" + idx;
      chip.innerHTML = it.name + " <b>" + it.w + "kg / 価値" + it.v + "</b>";
      box.appendChild(chip);
    });
    var cap = document.createElement("span");
    cap.className = "stat-chip";
    cap.innerHTML = "容量 <b>" + CAPACITY + "kg</b>";
    box.appendChild(cap);
  }

  /*
   * highlight: { active: {i,w}, refs: [{i,w}...], trace: [{i,w}...] }
   */
  function renderKnap(highlight) {
    var table = $("knap-table");
    table.textContent = "";
    var filledCount = knap.stepIdx;

    function cellState(i, w) {
      if (i === 0) return "filled"; /* 0行目は常に0で確定 */
      var pos = (i - 1) * (CAPACITY + 1) + w; /* この順でステップが進む */
      return pos < filledCount ? "filled" : "";
    }

    var thead = document.createElement("tr");
    var corner = document.createElement("th");
    corner.className = "rowhead";
    corner.textContent = "品物＼容量";
    thead.appendChild(corner);
    for (var w = 0; w <= CAPACITY; w++) {
      var th = document.createElement("th");
      th.textContent = w;
      thead.appendChild(th);
    }
    table.appendChild(thead);

    for (var i = 0; i <= ITEMS.length; i++) {
      var tr = document.createElement("tr");
      var head = document.createElement("th");
      head.className = "rowhead";
      head.textContent = i === 0 ? "なし" : ITEMS[i - 1].name + " (" + ITEMS[i - 1].w + "kg/" + ITEMS[i - 1].v + ")";
      tr.appendChild(head);
      for (var w2 = 0; w2 <= CAPACITY; w2++) {
        var td = document.createElement("td");
        var st = cellState(i, w2);
        if (st) {
          td.className = st;
          td.textContent = String(knap.res.table[i][w2]);
        }
        if (highlight) {
          if (highlight.active && highlight.active.i === i && highlight.active.w === w2) {
            td.className = "active";
            td.textContent = String(knap.res.table[i][w2]);
          }
          if (
            highlight.refs &&
            highlight.refs.some(function (r) {
              return r.i === i && r.w === w2;
            })
          ) {
            td.className = "ref";
          }
          if (
            highlight.trace &&
            highlight.trace.some(function (r) {
              return r.i === i && r.w === w2;
            })
          ) {
            td.className = "trace";
          }
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
  }

  function knapFinish() {
    /* 逆にたどって選んだ品物をハイライト */
    var trace = [];
    var wLeft = CAPACITY;
    for (var i = ITEMS.length; i >= 1; i--) {
      trace.push({ i: i, w: wLeft });
      if (knap.res.table[i][wLeft] !== knap.res.table[i - 1][wLeft]) {
        wLeft -= ITEMS[i - 1].w;
      }
    }
    trace.push({ i: 0, w: wLeft });
    renderKnap({ trace: trace });
    var names = knap.res.chosen.map(function (idx) {
      return ITEMS[idx].name;
    });
    setMsg(
      "knap-msg",
      "完成。最大価値は " + knap.res.best + "（選んだのは " + names.join("・") + "）。緑のマスは右下から「上と同じ値なら入れていない、違えば入れた」と逆にたどった跡。",
      "ok"
    );
  }

  function knapStepOnce() {
    var steps = knap.res.steps;
    if (knap.stepIdx >= steps.length) {
      knapFinish();
      return false;
    }
    var s = steps[knap.stepIdx];
    knap.stepIdx++;
    var refs = [{ i: s.i - 1, w: s.w }];
    var it = ITEMS[s.i - 1];
    if (s.take >= 0) refs.push({ i: s.i - 1, w: s.w - it.w });
    renderKnap({ active: { i: s.i, w: s.w }, refs: refs });
    var text;
    if (s.take < 0) {
      text = it.name + " は " + it.w + "kg なので容量 " + s.w + " には入らない。上のマスをそのまま写す → " + s.skip + "。";
    } else {
      text =
        "max(入れない↑ " + s.skip + ", 入れる↖ " + (s.take - it.v) + "+" + it.v + "=" + s.take + ") = " + Math.max(s.skip, s.take) + (s.taken ? "（入れる方が得）" : "（入れない方が得）");
    }
    setMsg("knap-msg", "row " + it.name + " × 容量 " + s.w + ": " + text, "info");
    if (knap.stepIdx >= steps.length) {
      setTimeout(function () {
        if (!knap.timer && knap.stepIdx >= steps.length) knapFinish();
      }, 1100);
    }
    return true;
  }

  function knapRow() {
    knapStop();
    if (knap.stepIdx >= knap.res.steps.length) {
      knapFinish();
      return;
    }
    var currentRow = knap.res.steps[knap.stepIdx].i;
    while (knap.stepIdx < knap.res.steps.length && knap.res.steps[knap.stepIdx].i === currentRow) {
      knap.stepIdx++;
    }
    renderKnap(null);
    setMsg("knap-msg", ITEMS[currentRow - 1].name + " の行を埋めた。次の行へ。", "info");
    if (knap.stepIdx >= knap.res.steps.length) knapFinish();
  }

  function knapAuto() {
    if (knap.stepIdx >= knap.res.steps.length) knapReset();
    knapStop();
    knap.timer = setInterval(function () {
      if (!knapStepOnce()) knapStop();
    }, 300);
  }

  /* ================= イベント ================= */
  document.addEventListener("DOMContentLoaded", function () {
    $("coin-amount").addEventListener("input", function () {
      $("coin-amount-label").textContent = this.value;
    });
    $("coin-amount").addEventListener("change", coinReset);
    $("coin-step-btn").addEventListener("click", function () {
      coinStop();
      coinStep();
    });
    $("coin-auto-btn").addEventListener("click", coinAuto);
    $("coin-reset-btn").addEventListener("click", coinReset);
    $("coin-quiz-btn").addEventListener("click", coinQuiz);
    $("coin-quiz-submit").addEventListener("click", coinQuizSubmit);
    $("coin-quiz-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") coinQuizSubmit();
    });

    $("knap-step-btn").addEventListener("click", function () {
      knapStop();
      knapStepOnce();
    });
    $("knap-row-btn").addEventListener("click", knapRow);
    $("knap-auto-btn").addEventListener("click", knapAuto);
    $("knap-reset-btn").addEventListener("click", knapReset);

    renderItems();
    coinReset();
    knapReset();
  });
})();
