/* 再帰・分割統治ページ: ハノイの塔 + フィボナッチ呼び出しツリー */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  /* ================= ハノイの塔 ================= */
  var PEG_NAMES = ["A", "B", "C"];
  var hanoi = {
    n: 3,
    pegs: [[], [], []], /* pegs[i] = 下から順の円盤サイズ */
    selected: -1, /* 持ち上げ中の杭 index */
    moves: 0,
    solved: false,
    autoTimer: null,
  };

  function hanoiSetMsg(text, cls) {
    var el = $("hanoi-msg");
    el.className = "msg " + cls;
    el.textContent = text;
  }

  function hanoiReset() {
    if (hanoi.autoTimer) {
      clearInterval(hanoi.autoTimer);
      hanoi.autoTimer = null;
    }
    hanoi.n = parseInt($("hanoi-n").value, 10);
    hanoi.pegs = [[], [], []];
    for (var d = hanoi.n; d >= 1; d--) hanoi.pegs[0].push(d);
    hanoi.selected = -1;
    hanoi.moves = 0;
    hanoi.solved = false;
    $("hanoi-best").textContent = String(Math.pow(2, hanoi.n) - 1);
    hanoiSetMsg("円盤のある杭をクリックして持ち上げよう。", "info");
    renderHanoi();
  }

  function renderHanoi() {
    var board = $("hanoi-board");
    board.textContent = "";
    hanoi.pegs.forEach(function (disks, pi) {
      var peg = document.createElement("div");
      peg.className = "hanoi-peg" + (pi === hanoi.selected ? " selected" : "");
      peg.tabIndex = 0;
      peg.setAttribute("role", "button");
      peg.setAttribute("aria-label", "杭 " + PEG_NAMES[pi] + "（円盤 " + disks.length + " 枚）");
      var label = document.createElement("span");
      label.className = "peg-label";
      label.textContent = PEG_NAMES[pi];
      peg.appendChild(label);
      disks.forEach(function (size, di) {
        var disk = document.createElement("div");
        disk.className = "hanoi-disk";
        /* サイズに応じた幅（最小 26% 〜 最大 90%） */
        var width = 26 + ((size - 1) / Math.max(1, hanoi.n - 1)) * 64;
        disk.style.width = width + "%";
        if (pi === hanoi.selected && di === disks.length - 1) disk.classList.add("lifted");
        peg.appendChild(disk);
      });
      function onActivate() {
        onPegClick(pi);
      }
      peg.addEventListener("click", onActivate);
      peg.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      });
      board.appendChild(peg);
    });
    $("hanoi-moves").textContent = String(hanoi.moves);
  }

  function tryMove(from, to) {
    var src = hanoi.pegs[from];
    var dst = hanoi.pegs[to];
    if (src.length === 0) return false;
    var disk = src[src.length - 1];
    if (dst.length > 0 && dst[dst.length - 1] < disk) {
      hanoiSetMsg("そこには置けない。小さい円盤の上に大きい円盤は乗せられない。", "err");
      return false;
    }
    dst.push(src.pop());
    hanoi.moves++;
    return true;
  }

  function checkSolved() {
    if (hanoi.pegs[2].length === hanoi.n) {
      hanoi.solved = true;
      var best = Math.pow(2, hanoi.n) - 1;
      hanoiSetMsg(
        hanoi.moves === best
          ? "完成。しかも最短の " + best + " 手。再帰の答えと同じ手順を自力で見つけたことになる。"
          : "完成（" + hanoi.moves + " 手 / 最短 " + best + " 手）。もう一度やって最短を狙うか、模範解答の手順と見比べてみよう。",
        "ok"
      );
      return true;
    }
    return false;
  }

  function onPegClick(pi) {
    if (hanoi.autoTimer || hanoi.solved) return;
    if (hanoi.selected === -1) {
      if (hanoi.pegs[pi].length === 0) {
        hanoiSetMsg("その杭には円盤がない。", "err");
        return;
      }
      hanoi.selected = pi;
      hanoiSetMsg("杭 " + PEG_NAMES[pi] + " の一番上を持ち上げた。移動先の杭をクリック（同じ杭で取り消し）。", "info");
    } else if (hanoi.selected === pi) {
      hanoi.selected = -1;
      hanoiSetMsg("持ち上げをやめた。", "info");
    } else {
      var from = hanoi.selected;
      if (tryMove(from, pi)) {
        hanoi.selected = -1;
        if (!checkSolved()) {
          hanoiSetMsg("杭 " + PEG_NAMES[from] + " → 杭 " + PEG_NAMES[pi] + " に移動（" + hanoi.moves + " 手目）。", "info");
        }
      }
    }
    renderHanoi();
  }

  function autoSolve() {
    hanoiReset();
    var moves = Algo.hanoiMoves(hanoi.n);
    var i = 0;
    hanoiSetMsg("再帰 solve(n, A→C) の手順を再生中… ①上の n−1 枚を退避 → ②最大を移す → ③退避を戻す、の入れ子に注目。", "info");
    hanoi.autoTimer = setInterval(function () {
      if (i >= moves.length) {
        clearInterval(hanoi.autoTimer);
        hanoi.autoTimer = null;
        hanoi.solved = true;
        hanoiSetMsg("完了。" + moves.length + " 手 = 2^" + hanoi.n + " − 1。これが再帰の生成する最短手順。", "ok");
        return;
      }
      var mv = moves[i++];
      hanoi.pegs[mv.to].push(hanoi.pegs[mv.from].pop());
      hanoi.moves++;
      renderHanoi();
    }, Math.max(180, 900 - hanoi.n * 110));
  }

  /* ================= fib 呼び出しツリー ================= */
  function renderTreeNode(node) {
    var wrap = document.createElement("div");
    wrap.className = "ct-node";
    var chip = document.createElement("span");
    chip.className = "ct-chip";
    if (node.cached) {
      chip.classList.add("cached");
      chip.textContent = "f(" + node.n + ")=" + node.value;
      chip.title = "メモから取得（再計算しない）";
    } else if (node.n <= 1) {
      chip.classList.add("leaf");
      chip.textContent = "f(" + node.n + ")=" + node.value;
    } else {
      chip.textContent = "f(" + node.n + ")";
    }
    wrap.appendChild(chip);
    if (node.children.length > 0) {
      var kids = document.createElement("div");
      kids.className = "ct-children";
      node.children.forEach(function (child) {
        kids.appendChild(renderTreeNode(child));
      });
      wrap.appendChild(kids);
    }
    return wrap;
  }

  function renderFib() {
    var n = parseInt($("fib-n").value, 10);
    var memoized = $("fib-memo").checked;
    $("fib-n-label").textContent = String(n);

    var naive = Algo.fibCallTree(n, false);
    var memo = Algo.fibCallTree(n, true);
    $("fib-calls-naive").textContent = String(naive.calls);
    $("fib-calls-memo").textContent = String(memo.calls);

    var box = $("fib-tree");
    box.textContent = "";
    box.appendChild(renderTreeNode(memoized ? memo.tree : naive.tree));
  }

  /* ================= イベント ================= */
  document.addEventListener("DOMContentLoaded", function () {
    $("hanoi-n").addEventListener("input", function () {
      $("hanoi-n-label").textContent = this.value;
    });
    $("hanoi-n").addEventListener("change", hanoiReset);
    $("hanoi-reset-btn").addEventListener("click", hanoiReset);
    $("hanoi-auto-btn").addEventListener("click", autoSolve);

    $("fib-n").addEventListener("input", renderFib);
    $("fib-memo").addEventListener("change", renderFib);

    Dojo.mountQuiz(
      { start: "rc-quiz-start", area: "rc-quiz-area", score: "rc-quiz-score" },
      [
        {
          q: "再帰の関数に必ず必要な「これ以上分けずに答えを返す場合」のことを何と呼ぶ？",
          options: ["ループ", "ベースケース", "メモ化", "ピボット"],
          answer: 1,
          explain: "ベースケース（止まる条件）を書き忘れると、関数は永遠に自分を呼び続けて暴走する。fib なら f(0)=0, f(1)=1 の部分。",
        },
        {
          q: "ハノイの塔・円盤 4 枚の最短手数は？",
          options: ["8 回", "15 回", "16 回", "31 回"],
          answer: 1,
          explain: "2ⁿ − 1 = 2⁴ − 1 = 15。漸化式「手数(n) = 2 × 手数(n−1) + 1」に 手数(3)=7 を入れても 15 になる。",
        },
        {
          q: "素朴な再帰の fib(n) が絶望的に遅い、いちばんの理由は？",
          options: ["再帰は必ずループより遅いから", "同じ計算を何度も繰り返しているから", "メモリを大量に使うから", "数が大きくなりすぎるから"],
          answer: 1,
          explain: "呼び出しツリーで見たとおり、同じ f(k) が何度も現れる。計算の重複こそが O(2ⁿ) の正体で、再帰そのものが悪いわけではない。",
        },
        {
          q: "メモ化した fib(n) の計算量は？",
          options: ["O(2ⁿ)", "O(n²)", "O(n)", "O(log n)"],
          answer: 2,
          explain: "各 f(k) は最初の 1 回だけ計算され、2 回目からはメモを見て即答。計算は n 種類ぶんしか起きないので O(n)。",
        },
      ]
    );

    hanoiReset();
    renderFib();
  });
})();
