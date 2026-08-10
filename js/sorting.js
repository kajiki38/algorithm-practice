/* ソート可視化ページ */
(function () {
  "use strict";

  var ALGO_NOTES = {
    bubble:
      "隣り合う 2 要素を比較し、逆順なら交換。1 周ごとに最大値が右端に確定していく（緑が右から伸びる）。" +
      "この実装の比較回数は入力の並びに関わらず常に約 n²/2 回。「ほぼ整列済み」でも遅いことを確認してみよう。",
    selection:
      "未ソート部分を全部見て最小値を探し、先頭と交換。交換（赤）が 1 周に 1 回しか起きないのが特徴。" +
      "比較回数はどんな入力でも同じ。つまり入力の並びに鈍感なアルゴリズム。",
    insertion:
      "i 番目の要素を、左のソート済み部分の正しい位置まで左へずらしながら挿入する。" +
      "プリセット「ほぼ整列済み」にすると劇的に速くなる（比較回数を見よ）。逆順が最悪ケース。",
    quick:
      "末尾をピボット（紫）とし、それより小さい要素を左に寄せてからピボットを確定（緑）。" +
      "左右それぞれを再帰的に処理。プリセット「逆順」や「ほぼ整列済み」では分割が偏り、比較回数が跳ね上がる。",
    merge:
      "配列を半分ずつに分割していき、ソート済みの 2 つの区間を「マージ」しながら戻る。" +
      "交換ではなく書き戻し（set）で並べ替えるのがポイント。比較回数はどんな入力でも n log n 程度で安定。",
    shell:
      "間隔(ギャップ)を空けた要素同士で挿入ソートし、ギャップを半分ずつ詰めていく。" +
      "序盤の大きなギャップで遠くの要素が一気に近くへ運ばれるのがミソ。挿入ソートと同じ配列で比較回数を見比べてみよう。",
    heap:
      "前半は配列を「最大ヒープ」（親が子より大きい木を配列で表現したもの）に組み替えるフェーズ。" +
      "後半は先頭(最大値)を末尾と交換して確定（緑）→ 根を沈め直す、の繰り返し。追加メモリなしで最悪 O(n log n) を保証する。",
  };

  var ALGO_LABELS = {
    bubble: "バブルソート",
    selection: "選択ソート",
    insertion: "挿入ソート",
    shell: "シェルソート",
    quick: "クイックソート",
    merge: "マージソート",
    heap: "ヒープソート",
  };

  /* ---------- 状態 ---------- */
  var state = {
    algo: "bubble",
    baseArray: [],
    ops: [],
    step: -1, // -1 = 初期状態（何も適用していない）
    playing: false,
    timer: null,
  };

  var $ = function (id) {
    return document.getElementById(id);
  };

  /* ---------- 配列生成 ---------- */
  function generateArray(n, preset) {
    var a = [];
    var i;
    switch (preset) {
      case "nearly":
        for (i = 0; i < n; i++) a.push(i + 1);
        /* 数か所だけランダムに入れ替える */
        var swaps = Math.max(1, Math.floor(n / 10));
        for (i = 0; i < swaps; i++) {
          var x = Dojo.randInt(0, n - 1);
          var y = Dojo.clamp(x + Dojo.randInt(1, 3), 0, n - 1);
          var t = a[x];
          a[x] = a[y];
          a[y] = t;
        }
        return a;
      case "reversed":
        for (i = 0; i < n; i++) a.push(n - i);
        return a;
      case "few":
        for (i = 0; i < n; i++) a.push(Dojo.randInt(1, 5) * Math.ceil(n / 5));
        return a;
      default: {
        for (i = 0; i < n; i++) a.push(i + 1);
        return Dojo.shuffle(a);
      }
    }
  }

  /* ---------- 描画 ---------- */
  function renderBars(container, snapshot, maxValue) {
    var frag = document.createDocumentFragment();
    var arr = snapshot.array;
    var hl = snapshot.highlight;
    for (var i = 0; i < arr.length; i++) {
      var bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = (arr[i] / maxValue) * 100 + "%";
      if (snapshot.sorted[i]) {
        bar.classList.add("done");
      } else if (snapshot.range && (i < snapshot.range.lo || i > snapshot.range.hi)) {
        bar.classList.add("dim");
      }
      if (i === snapshot.pivot) bar.classList.add("pivot");
      if (hl) {
        if (hl.t === "compare" && (i === hl.i || i === hl.j)) bar.classList.add("compare");
        if (hl.t === "swap" && (i === hl.i || i === hl.j)) bar.classList.add("swap");
        if (hl.t === "set" && i === hl.i) bar.classList.add("swap");
      }
      frag.appendChild(bar);
    }
    container.textContent = "";
    container.appendChild(frag);
  }

  function renderPseudocode() {
    var lines = Algo.PSEUDO[state.algo];
    var pre = $("pseudocode");
    pre.textContent = "";
    lines.forEach(function (text, idx) {
      var div = document.createElement("div");
      div.className = "line";
      div.dataset.line = idx;
      div.textContent = text;
      pre.appendChild(div);
    });
  }

  function highlightLine(lineNo) {
    var lines = $("pseudocode").children;
    for (var i = 0; i < lines.length; i++) {
      lines[i].classList.toggle("active", i === lineNo);
    }
  }

  function render() {
    var snapshot = Algo.replay(state.baseArray, state.ops, state.step);
    var maxValue = Math.max.apply(null, state.baseArray);
    renderBars($("bars"), snapshot, maxValue);
    highlightLine(snapshot.highlight && typeof snapshot.highlight.line === "number" ? snapshot.highlight.line : -1);
    $("stat-step").textContent = (state.step + 1) + " / " + state.ops.length;
    $("stat-compare").textContent = snapshot.comparisons;
    $("stat-write").textContent = snapshot.writes;
    $("progress-slider").value = state.step + 1;
    $("play-btn").innerHTML = state.playing
      ? '<span class="ico ico-pause"></span>一時停止'
      : '<span class="ico ico-play"></span>再生';
    $("step-btn").disabled = state.step >= state.ops.length - 1;
    $("step-back-btn").disabled = state.step < 0;
  }

  /* ---------- 再生制御 ---------- */
  function stopPlaying() {
    state.playing = false;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  }

  function tickDelay() {
    var speed = parseInt($("speed-slider").value, 10);
    return 230 - speed * 2.1; /* speed 1 → 約228ms, 100 → 20ms */
  }

  function opsPerTick() {
    var speed = parseInt($("speed-slider").value, 10);
    /* 操作列が長いほど 1 tick で多く進め、体感速度を揃える */
    return Math.max(1, Math.round(((speed / 100) * state.ops.length) / 400));
  }

  function playTick() {
    if (!state.playing) return;
    state.step = Math.min(state.step + opsPerTick(), state.ops.length - 1);
    render();
    if (state.step >= state.ops.length - 1) {
      stopPlaying();
      render();
      return;
    }
    state.timer = setTimeout(playTick, tickDelay());
  }

  /* ---------- 初期化・再構築 ---------- */
  function rebuild(keepArray) {
    stopPlaying();
    if (!keepArray) {
      var n = parseInt($("size-slider").value, 10);
      state.baseArray = generateArray(n, $("preset-select").value);
    }
    var out = Algo.SORTERS[state.algo](state.baseArray);
    state.ops = out.ops;
    state.step = -1;
    $("progress-slider").max = state.ops.length;
    $("algo-note").textContent = ALGO_NOTES[state.algo];
    renderPseudocode();
    render();
  }

  /* ---------- 観察チャレンジ ---------- */
  var challenge = {
    algo: null,
    baseArray: [],
    ops: [],
    timer: null,
    answered: false,
    score: 0,
    total: 0,
  };

  function challengeAnimate() {
    if (challenge.timer) clearInterval(challenge.timer);
    var step = -1;
    var maxValue = Math.max.apply(null, challenge.baseArray);
    var container = $("challenge-bars");
    var perTick = Math.max(1, Math.round(challenge.ops.length / 260));
    challenge.timer = setInterval(function () {
      step = Math.min(step + perTick, challenge.ops.length - 1);
      var snapshot = Algo.replay(challenge.baseArray, challenge.ops, step);
      /* ピボット表示はクイックソートだとバレやすいが、それも観察のヒントのうち */
      renderBars(container, snapshot, maxValue);
      if (step >= challenge.ops.length - 1) {
        clearInterval(challenge.timer);
        challenge.timer = null;
      }
    }, 30);
  }

  function newChallenge() {
    var algos = Object.keys(ALGO_LABELS);
    challenge.algo = algos[Dojo.randInt(0, algos.length - 1)];
    challenge.baseArray = generateArray(28, "random");
    challenge.ops = Algo.SORTERS[challenge.algo](challenge.baseArray).ops;
    challenge.answered = false;
    $("challenge-area").style.display = "";
    $("challenge-result").textContent = "";
    $("challenge-result").className = "";

    var optArea = $("challenge-options");
    optArea.textContent = "";
    /* 選択肢の並びは毎回シャッフル */
    Dojo.shuffle(Object.keys(ALGO_LABELS)).forEach(function (algoKey) {
      var btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = ALGO_LABELS[algoKey];
      btn.addEventListener("click", function () {
        answerChallenge(algoKey, btn);
      });
      optArea.appendChild(btn);
    });
    challengeAnimate();
  }

  function answerChallenge(algoKey, clickedBtn) {
    if (challenge.answered) return;
    challenge.answered = true;
    challenge.total++;
    var correct = algoKey === challenge.algo;
    if (correct) challenge.score++;

    var buttons = $("challenge-options").querySelectorAll(".quiz-option");
    buttons.forEach(function (b) {
      b.disabled = true;
      if (b.textContent === ALGO_LABELS[challenge.algo]) b.classList.add("correct");
    });
    if (!correct) clickedBtn.classList.add("wrong");

    var result = $("challenge-result");
    result.className = "msg " + (correct ? "ok" : "err");
    result.textContent = correct
      ? "正解！ " + ALGO_LABELS[challenge.algo] + " でした。"
      : "残念。正解は「" + ALGO_LABELS[challenge.algo] + "」。もう一度動きを見て、確定（緑）の付き方に注目してみよう。";
    $("challenge-score").textContent = challenge.score + " / " + challenge.total;
  }

  /* ---------- イベント ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    $("algo-select").addEventListener("change", function () {
      state.algo = this.value;
      rebuild(true);
    });
    $("size-slider").addEventListener("input", function () {
      $("size-label").textContent = this.value;
    });
    $("size-slider").addEventListener("change", function () {
      rebuild(false);
    });
    $("preset-select").addEventListener("change", function () {
      rebuild(false);
    });
    $("shuffle-btn").addEventListener("click", function () {
      rebuild(false);
    });
    $("reset-btn").addEventListener("click", function () {
      stopPlaying();
      state.step = -1;
      render();
    });
    $("step-btn").addEventListener("click", function () {
      stopPlaying();
      state.step = Math.min(state.step + 1, state.ops.length - 1);
      render();
    });
    $("step-back-btn").addEventListener("click", function () {
      stopPlaying();
      state.step = Math.max(state.step - 1, -1);
      render();
    });
    $("play-btn").addEventListener("click", function () {
      if (state.playing) {
        stopPlaying();
        render();
        return;
      }
      if (state.step >= state.ops.length - 1) state.step = -1;
      state.playing = true;
      render();
      playTick();
    });
    $("progress-slider").addEventListener("input", function () {
      stopPlaying();
      state.step = parseInt(this.value, 10) - 1;
      render();
    });
    $("challenge-btn").addEventListener("click", newChallenge);
    $("challenge-replay").addEventListener("click", challengeAnimate);

    rebuild(false);
  });
})();
