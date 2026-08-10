/* 二分探索ページ */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  /* ================= STEP 1: 数当てゲーム ================= */
  var MAX_NUM = 127;
  var game = {
    answer: 0,
    lo: 1,
    hi: MAX_NUM,
    count: 0,
    finished: false,
    autoTimer: null,
  };

  function newGame() {
    if (game.autoTimer) {
      clearTimeout(game.autoTimer);
      game.autoTimer = null;
    }
    game.answer = Dojo.randInt(1, MAX_NUM);
    game.lo = 1;
    game.hi = MAX_NUM;
    game.count = 0;
    game.finished = false;
    $("guess-count").textContent = "0";
    $("guess-log").textContent = "";
    $("guess-input").value = "";
    $("guess-input").disabled = false;
    $("guess-btn").disabled = false;
    renderRange();
  }

  function renderRange() {
    var fill = $("guess-range-fill");
    var left = ((game.lo - 1) / MAX_NUM) * 100;
    var width = ((game.hi - game.lo + 1) / MAX_NUM) * 100;
    fill.style.left = left + "%";
    fill.style.width = width + "%";
    $("guess-range-label").textContent = game.finished
      ? "正解: " + game.answer
      : "残りの候補: " + game.lo + " 〜 " + game.hi + "（" + (game.hi - game.lo + 1) + " 個）";
  }

  function addLog(text, cls) {
    var div = document.createElement("div");
    div.className = "msg " + (cls || "");
    div.textContent = text;
    var log = $("guess-log");
    log.insertBefore(div, log.firstChild);
  }

  function makeGuess(value, byBot) {
    if (game.finished) return;
    if (isNaN(value) || value < 1 || value > MAX_NUM) {
      addLog("1〜" + MAX_NUM + " の整数を入力してね。", "err");
      return;
    }
    game.count++;
    $("guess-count").textContent = String(game.count);
    var who = byBot ? "お手本 " : "";

    if (value === game.answer) {
      game.finished = true;
      var judge =
        game.count <= 7 ? "お見事！ log₂(128) = 7 回以内で到達。" : "正解！ 次は 7 回以内を目指して、毎回「残り候補のちょうど真ん中」を選んでみよう。";
      addLog(who + value + " → 正解（" + game.count + " 回） " + judge, "ok");
      $("guess-input").disabled = true;
      $("guess-btn").disabled = true;
    } else if (value < game.answer) {
      if (value >= game.lo) game.lo = value + 1;
      addLog(who + value + " → もっと大きい ↑（残り " + (game.hi - game.lo + 1) + " 個）", "info");
    } else {
      if (value <= game.hi) game.hi = value - 1;
      addLog(who + value + " → もっと小さい ↓（残り " + (game.hi - game.lo + 1) + " 個）", "info");
    }
    renderRange();
  }

  function autoPlay() {
    newGame();
    addLog("二分探索で解いてみせよう。毎回「残り候補の真ん中」を選ぶのがコツ。", "info");
    function step() {
      if (game.finished) {
        game.autoTimer = null;
        return;
      }
      var mid = Math.floor((game.lo + game.hi) / 2);
      makeGuess(mid, true);
      game.autoTimer = setTimeout(step, 900);
    }
    game.autoTimer = setTimeout(step, 700);
  }

  /* ============ STEP 2: 手動二分探索 ============ */
  var manual = {
    arr: [],
    target: 0,
    targetExists: true,
    lo: 0,
    hi: 0,
    mid: -1,
    phase: "idle", // idle | pick-mid | decide | done
    moves: 0,
    mistakes: 0,
  };

  function newManual() {
    /* 重複なしのソート済み配列を生成 */
    var pool = [];
    for (var v = 1; v <= 99; v++) pool.push(v);
    manual.arr = Dojo.shuffle(pool).slice(0, 15).sort(function (a, b) {
      return a - b;
    });
    /* 3 回に 1 回くらいは「存在しない値」を出題する */
    manual.targetExists = Dojo.randInt(1, 3) !== 1;
    if (manual.targetExists) {
      manual.target = manual.arr[Dojo.randInt(0, manual.arr.length - 1)];
    } else {
      do {
        manual.target = Dojo.randInt(1, 99);
      } while (manual.arr.indexOf(manual.target) !== -1);
    }
    manual.lo = 0;
    manual.hi = manual.arr.length - 1;
    manual.mid = -1;
    manual.phase = "pick-mid";
    manual.moves = 0;
    manual.mistakes = 0;
    $("manual-target").textContent = String(manual.target);
    setStatus("① 現在の範囲 [" + manual.lo + ", " + manual.hi + "] の中央の要素をクリックしよう。mid = (lo + hi) ÷ 2 の切り捨て。", "info");
    renderManual();
  }

  function setStatus(text, cls) {
    var el = $("manual-status");
    el.className = "msg " + (cls || "info");
    el.textContent = text;
  }

  function updateManualStats() {
    $("manual-moves").textContent = String(manual.moves);
    $("manual-mistakes").textContent = String(manual.mistakes);
  }

  function renderManual() {
    updateManualStats();
    var container = $("manual-cells");
    container.textContent = "";
    manual.arr.forEach(function (value, idx) {
      var cell = document.createElement("button");
      cell.className = "array-cell";
      cell.innerHTML = '<span class="idx">' + idx + "</span>" + value;
      var inRange = idx >= manual.lo && idx <= manual.hi && manual.lo <= manual.hi;
      if (!inRange && manual.phase !== "done") cell.classList.add("dim");
      if (manual.phase === "done" && manual.targetExists && value === manual.target) cell.classList.add("found");
      if (idx === manual.mid && manual.phase === "decide") cell.classList.add("mid");
      if (inRange && (idx === manual.lo || idx === manual.hi) && manual.phase !== "done") cell.classList.add("lo-hi");
      cell.addEventListener("click", function () {
        onCellClick(idx);
      });
      container.appendChild(cell);
    });
    $("manual-actions").style.display = manual.phase === "decide" || manual.phase === "pick-mid" ? "" : "none";
    /* 行動ボタンは decide フェーズのみ有効 */
    ["act-left", "act-right", "act-found", "act-absent"].forEach(function (id) {
      $(id).disabled = manual.phase !== "decide" && !(id === "act-absent" && manual.phase === "pick-mid" && manual.lo > manual.hi);
    });
  }

  function onCellClick(idx) {
    if (manual.phase !== "pick-mid") return;
    if (manual.lo > manual.hi) {
      setStatus("範囲がもう空だ。クリックではなく「存在しないと結論」を選ぼう。", "err");
      return;
    }
    manual.moves++;
    var correctMid = Math.floor((manual.lo + manual.hi) / 2);
    if (idx !== correctMid) {
      manual.mistakes++;
      setStatus(
        "そこは中央じゃない。lo = " + manual.lo + ", hi = " + manual.hi + " だから mid = (" + manual.lo + " + " + manual.hi + ") ÷ 2 = " + correctMid + " のはず。",
        "err"
      );
      updateManualStats();
      return;
    }
    manual.mid = idx;
    manual.phase = "decide";
    var midValue = manual.arr[idx];
    var rel = midValue === manual.target ? "＝ 一致！" : midValue < manual.target ? "＜ 探している値（" + manual.target + "）の方が大きい" : "＞ 探している値（" + manual.target + "）の方が小さい";
    setStatus("② a[" + idx + "] = " + midValue + " " + rel + "。次の行動を下のボタンから選ぼう。", "info");
    renderManual();
  }

  function onAction(action) {
    if (manual.phase === "pick-mid" && action === "absent") {
      manual.moves++;
      if (manual.lo > manual.hi) {
        manual.phase = "done";
        setStatus("正解。範囲が空になった＝配列に " + manual.target + " は存在しない。二分探索は「無い」ことも高速に証明できる。", "ok");
      } else {
        manual.mistakes++;
        setStatus("まだ範囲 [" + manual.lo + ", " + manual.hi + "] が残っている。先に中央を調べよう。", "err");
      }
      renderManual();
      return;
    }
    if (manual.phase !== "decide") return;
    manual.moves++;
    var midValue = manual.arr[manual.mid];
    var correct = midValue === manual.target ? "found" : manual.target < midValue ? "left" : "right";
    if (action !== correct) {
      manual.mistakes++;
      var hints = {
        found: "a[mid] = " + midValue + " は目的の値 " + manual.target + " と一致している！",
        left: manual.target + " ＜ " + midValue + " だから、目的の値があるとすれば mid より左側。",
        right: manual.target + " ＞ " + midValue + " だから、目的の値があるとすれば mid より右側。",
        absent: "",
      };
      setStatus("それは違う。" + hints[correct], "err");
      updateManualStats();
      return;
    }
    if (action === "found") {
      manual.phase = "done";
      setStatus(
        "発見。index " + manual.mid + " に " + manual.target + " があった。手数 " + manual.moves + "・ミス " + manual.mistakes + "。15 要素なら最大 4 回の比較で決着する。",
        "ok"
      );
    } else {
      if (action === "left") manual.hi = manual.mid - 1;
      else manual.lo = manual.mid + 1;
      manual.mid = -1;
      manual.phase = "pick-mid";
      if (manual.lo > manual.hi) {
        setStatus("範囲が空になった（lo " + manual.lo + " ＞ hi " + manual.hi + "）。ということは…？「存在しないと結論」を選ぼう。", "info");
      } else {
        setStatus("範囲を [" + manual.lo + ", " + manual.hi + "] に絞った（残り " + (manual.hi - manual.lo + 1) + " 要素）。① 中央をクリック。", "info");
      }
    }
    renderManual();
  }

  /* ============ STEP 3: 線形 vs 二分 ============ */
  function renderRace() {
    var exp = parseFloat($("race-n").value);
    var n = Math.round(Math.pow(10, exp));
    var linear = n;
    var binary = Math.max(1, Math.ceil(Math.log2(n + 1)));
    $("race-n-label").textContent = n.toLocaleString("ja-JP");
    $("race-linear").textContent = linear.toLocaleString("ja-JP") + " 回";
    $("race-binary").textContent = binary.toLocaleString("ja-JP") + " 回";
    $("race-bar-linear").style.width = "100%";
    $("race-bar-binary").style.width = Math.max(0.4, (binary / linear) * 100) + "%";
  }

  /* ================= イベント ================= */
  document.addEventListener("DOMContentLoaded", function () {
    $("guess-btn").addEventListener("click", function () {
      makeGuess(parseInt($("guess-input").value, 10), false);
      $("guess-input").value = "";
      $("guess-input").focus();
    });
    $("guess-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") $("guess-btn").click();
    });
    $("guess-new-btn").addEventListener("click", newGame);
    $("guess-auto-btn").addEventListener("click", autoPlay);

    $("manual-new-btn").addEventListener("click", newManual);
    $("act-left").addEventListener("click", function () {
      onAction("left");
    });
    $("act-right").addEventListener("click", function () {
      onAction("right");
    });
    $("act-found").addEventListener("click", function () {
      onAction("found");
    });
    $("act-absent").addEventListener("click", function () {
      onAction("absent");
    });

    $("race-n").addEventListener("input", renderRace);

    Dojo.mountQuiz(
      { start: "bs-quiz-start", area: "bs-quiz-area", score: "bs-quiz-score" },
      [
        {
          q: "二分探索を使うために、データが満たしていないといけない条件は？",
          options: ["値がすべて数値であること", "あらかじめ順番に並んでいること（ソート済み）", "重複する値がないこと", "データ数が偶数であること"],
          answer: 1,
          explain: "「真ん中と比べて半分を捨てる」が成り立つのは、並び順が保証されているから。並んでいないデータは、先にソートするか線形探索を使う。",
        },
        {
          q: "1,000 件のソート済みデータから二分探索で探すとき、最悪でも比較は約何回？",
          options: ["約 10 回", "約 100 回", "約 500 回", "約 1,000 回"],
          answer: 0,
          explain: "1000 → 500 → 250 → … と半分にしていくと、10 回で候補は 1 件になる（2¹⁰ = 1024）。この強さには STEP 3「計算量」で O(log n) という名前がつく。",
        },
        {
          q: "lo = 4, hi = 9 のとき、次に調べる mid はどこ？",
          options: ["4", "6", "7", "6.5"],
          answer: 1,
          explain: "(4 + 9) ÷ 2 = 6.5 を切り捨てて 6。インデックスに小数は存在しないので、常に切り捨てる。",
        },
        {
          q: "「探している値は存在しない」と確定するのはどんなとき？",
          options: ["mid の値が 0 だったとき", "3 回比較しても見つからないとき", "lo が hi を追い越したとき（範囲が空になったとき）", "配列の端に到達したとき"],
          answer: 2,
          explain: "範囲が空 ＝ 候補が 1 つも残っていない、ということ。STEP 2 で体験したとおり、二分探索は「無い」ことも高速に証明できる。",
        },
      ]
    );

    newGame();
    newManual();
    renderRace();
  });
})();
