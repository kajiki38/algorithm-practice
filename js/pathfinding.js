/* 経路探索ページ */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  var ROWS = 15;
  var COLS = 25;

  var state = {
    walls: new Set(),
    weights: new Set(),
    start: [7, 3],
    goal: [7, 21],
    tool: "wall",
    painting: false,
    paintMode: "add", // ドラッグ開始時に決めて、ドラッグ中は追加/削除どちらかに固定
    timer: null,
    cells: [], // cells[r][c] = DOM要素
    cursor: null, // キーボード操作用カーソル [r, c]
  };

  var ALGO_LABELS = {
    bfs: "BFS",
    dfs: "DFS",
    dijkstra: "ダイクストラ法",
    astar: "A*",
    greedy: "貪欲最良優先",
  };

  function key(r, c) {
    return r + "," + c;
  }

  function samePos(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  }

  /* ---------- グリッド構築 ---------- */
  function buildGrid() {
    var grid = $("pf-grid");
    grid.style.gridTemplateColumns = "repeat(" + COLS + ", 1fr)";
    grid.tabIndex = 0;
    grid.setAttribute("role", "application");
    grid.setAttribute(
      "aria-label",
      "迷路グリッド。矢印キーでカーソルを移動し、Enter か Space で選択中のツール（壁・沼・消しゴム・スタート・ゴール）を適用できます。マウスの場合はドラッグで描画。"
    );
    grid.textContent = "";
    state.cells = [];
    for (var r = 0; r < ROWS; r++) {
      var row = [];
      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement("div");
        cell.className = "pf-cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        grid.appendChild(cell);
        row.push(cell);
      }
      state.cells.push(row);
    }
  }

  function redraw() {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = state.cells[r][c];
        cell.className = "pf-cell";
        var k = key(r, c);
        if (state.walls.has(k)) cell.classList.add("wall");
        if (state.weights.has(k)) cell.classList.add("weight");
      }
    }
    state.cells[state.start[0]][state.start[1]].classList.add("start");
    state.cells[state.goal[0]][state.goal[1]].classList.add("goal");
    if (state.cursor) {
      state.cells[state.cursor[0]][state.cursor[1]].classList.add("cursor");
    }
  }

  function stopAnimation() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
      /* 途中で打ち切られたら「…」のまま残さない */
      $("pf-visited").textContent = "-";
      $("pf-length").textContent = "-";
      $("pf-cost").textContent = "-";
    }
  }

  /* ---------- お絵かき ---------- */
  function applyTool(r, c, isFirst) {
    var k = key(r, c);
    var onStart = samePos([r, c], state.start);
    var onGoal = samePos([r, c], state.goal);

    switch (state.tool) {
      case "wall":
        if (onStart || onGoal) return;
        if (isFirst) state.paintMode = state.walls.has(k) ? "remove" : "add";
        if (state.paintMode === "add") {
          state.walls.add(k);
          state.weights.delete(k);
        } else {
          state.walls.delete(k);
        }
        break;
      case "weight":
        if (onStart || onGoal) return;
        if (isFirst) state.paintMode = state.weights.has(k) ? "remove" : "add";
        if (state.paintMode === "add") {
          state.weights.add(k);
          state.walls.delete(k);
        } else {
          state.weights.delete(k);
        }
        break;
      case "erase":
        state.walls.delete(k);
        state.weights.delete(k);
        break;
      case "start":
        if (state.walls.has(k) || onGoal) return;
        state.start = [r, c];
        break;
      case "goal":
        if (state.walls.has(k) || onStart) return;
        state.goal = [r, c];
        break;
    }
    redraw();
  }

  function cellFromEvent(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !el.classList || !el.classList.contains("pf-cell")) return null;
    return [parseInt(el.dataset.r, 10), parseInt(el.dataset.c, 10)];
  }

  function setupPainting() {
    var grid = $("pf-grid");
    grid.addEventListener("pointerdown", function (e) {
      var pos = cellFromEvent(e);
      if (!pos) return;
      stopAnimation();
      state.painting = true;
      applyTool(pos[0], pos[1], true);
      e.preventDefault();
    });
    grid.addEventListener("pointermove", function (e) {
      if (!state.painting) return;
      var pos = cellFromEvent(e);
      if (pos) applyTool(pos[0], pos[1], false);
    });
    window.addEventListener("pointerup", function () {
      state.painting = false;
    });
  }

  /* キーボードでも描けるようにする（矢印で移動、Enter/Space で適用） */
  function setupKeyboard() {
    var grid = $("pf-grid");
    var MOVES = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    grid.addEventListener("keydown", function (e) {
      if (MOVES[e.key]) {
        e.preventDefault();
        if (!state.cursor) {
          state.cursor = state.start.slice();
        } else {
          state.cursor = [
            Dojo.clamp(state.cursor[0] + MOVES[e.key][0], 0, ROWS - 1),
            Dojo.clamp(state.cursor[1] + MOVES[e.key][1], 0, COLS - 1),
          ];
        }
        redraw();
      } else if ((e.key === "Enter" || e.key === " ") && state.cursor) {
        e.preventDefault();
        stopAnimation();
        applyTool(state.cursor[0], state.cursor[1], true);
      }
    });
    grid.addEventListener("blur", function () {
      state.cursor = null;
      redraw();
    });
  }

  /* ---------- 探索の実行とアニメーション ---------- */
  function runSearch(algoKey) {
    return Algo.PATHFINDERS[algoKey]({
      rows: ROWS,
      cols: COLS,
      walls: state.walls,
      weights: state.weights,
      start: state.start,
      goal: state.goal,
    });
  }

  function setMessage(text, cls) {
    var el = $("pf-message");
    if (!text) {
      el.textContent = "";
      el.className = "";
      return;
    }
    el.className = "msg " + cls;
    el.textContent = text;
  }

  function animate(result, onDone) {
    stopAnimation();
    redraw();
    setMessage("");
    var visited = result.visitedOrder;
    var speed = parseInt($("pf-speed").value, 10);
    var perTick = Math.max(1, Math.round(speed / 12));
    var i = 0;
    $("pf-visited").textContent = "…";
    $("pf-length").textContent = "…";
    $("pf-cost").textContent = "…";

    state.timer = setInterval(function () {
      for (var n = 0; n < perTick && i < visited.length; n++, i++) {
        var pos = visited[i];
        if (!samePos(pos, state.start) && !samePos(pos, state.goal)) {
          state.cells[pos[0]][pos[1]].classList.add("visited");
        }
      }
      if (i >= visited.length) {
        stopAnimation();
        if (result.path) {
          result.path.forEach(function (pos) {
            if (!samePos(pos, state.start) && !samePos(pos, state.goal)) {
              state.cells[pos[0]][pos[1]].classList.remove("visited");
              state.cells[pos[0]][pos[1]].classList.add("path");
            }
          });
        }
        $("pf-visited").textContent = String(visited.length);
        $("pf-length").textContent = result.path ? result.path.length - 1 + " マス" : "-";
        $("pf-cost").textContent = result.path ? String(result.cost) : "-";
        if (!result.path) {
          setMessage("経路が見つからなかった（ゴールに到達できない）。どのアルゴリズムも、全探索し尽くせば「無い」と正しく言える。", "err");
        }
        if (onDone) onDone();
      }
    }, 24);
  }

  function runAndAnimate() {
    $("pf-compare-result").textContent = "";
    animate(runSearch($("pf-algo").value));
  }

  /* 4 アルゴリズムを順に実行して結果表を出す */
  function compareAll() {
    var keys = ["bfs", "dfs", "dijkstra", "astar", "greedy"];
    var results = {};
    keys.forEach(function (k) {
      results[k] = runSearch(k);
    });

    var container = $("pf-compare-result");
    container.textContent = "";
    var table = document.createElement("table");
    table.className = "simple";
    table.style.marginTop = "12px";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>アルゴリズム</th><th>探索したマス</th><th>経路の長さ</th><th>経路のコスト</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    var minCost = Infinity;
    keys.forEach(function (k) {
      if (results[k].path) minCost = Math.min(minCost, results[k].cost);
    });
    keys.forEach(function (k) {
      var r = results[k];
      var tr = document.createElement("tr");
      var costText = r.path ? String(r.cost) : "経路なし";
      if (r.path && r.cost === minCost) {
        costText += ' <span class="ico ico-check" style="color:var(--accent-2)"></span>';
      }
      tr.innerHTML =
        "<td>" + ALGO_LABELS[k] + "</td><td>" + r.visitedOrder.length + "</td><td>" + (r.path ? r.path.length - 1 + " マス" : "-") + "</td><td>" + costText + "</td>";
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    var note = document.createElement("p");
    note.style.cssText = "color: var(--text-dim); font-size: 0.85rem; margin: 8px 0 0;";
    note.innerHTML =
      '<span class="ico ico-check" style="color:var(--accent-2);vertical-align:-2px"></span> = 最小コスト。沼があると BFS/DFS のコストが悪化すること、A* の探索マス数がダイクストラより少ないこと、貪欲最良優先は探索マス数こそ最少級でも経路のコストは保証されないことに注目。';
    container.appendChild(note);

    /* 選択中のアルゴリズムをアニメーション表示 */
    animate(results[$("pf-algo").value]);
  }

  /* ---------- プリセット ---------- */
  function randomWalls() {
    stopAnimation();
    state.walls.clear();
    state.weights.clear();
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var pos = [r, c];
        if (samePos(pos, state.start) || samePos(pos, state.goal)) continue;
        var roll = Math.random();
        if (roll < 0.22) state.walls.add(key(r, c));
        else if (roll < 0.3) state.weights.add(key(r, c));
      }
    }
    redraw();
    setMessage("");
    $("pf-compare-result").textContent = "";
  }

  function clearAll() {
    stopAnimation();
    state.walls.clear();
    state.weights.clear();
    redraw();
    setMessage("");
    $("pf-compare-result").textContent = "";
  }

  /* ---------- イベント ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildGrid();
    redraw();
    setupPainting();
    setupKeyboard();

    ["tool-wall", "tool-weight", "tool-erase", "tool-start", "tool-goal"].forEach(function (id) {
      $(id).addEventListener("click", function () {
        state.tool = this.dataset.tool;
        document.querySelectorAll("[data-tool]").forEach(function (b) {
          b.classList.toggle("toggled", b.dataset.tool === state.tool);
        });
      });
    });

    $("pf-run-btn").addEventListener("click", runAndAnimate);
    $("pf-compare-btn").addEventListener("click", compareAll);
    $("random-walls-btn").addEventListener("click", randomWalls);
    $("clear-btn").addEventListener("click", clearAll);

    Dojo.mountQuiz(
      { start: "pq-quiz-start", area: "pq-quiz-area", score: "pq-quiz-score" },
      [
        {
          q: "BFS（幅優先探索）が「次に調べるマス」を管理するのに使う入れ物は？",
          options: ["スタック", "キュー", "優先度付きキュー", "ハッシュテーブル"],
          answer: 1,
          explain: "先に見つけたマスから順に調べる（FIFO）から波紋のように広がる。ちなみにスタックに変えるだけで DFS になる。",
        },
        {
          q: "沼（コスト 5）がある地図で「コストが最小の経路」を保証してくれるのは？",
          options: ["DFS", "BFS", "ダイクストラ法", "貪欲最良優先"],
          answer: 2,
          explain: "BFS が保証するのは「マス数」の最短で、コストは見ていないので沼を突っ切ってしまう。コスト最小の保証はダイクストラ法（と条件を満たす A*）。",
        },
        {
          q: "A* のヒューリスティック（見積り）が最短保証を壊さないための条件は？",
          options: ["必ず 0 であること", "実際の残りコストより大きく見積もらないこと", "ゴールの位置を使わないこと", "毎回ランダムに変えること"],
          answer: 1,
          explain: "控えめな見積り（過大評価しない）なら、有望な経路を誤って切り捨てることがない。大げさに見積もると貪欲法のように騙される。",
        },
        {
          q: "貪欲最良優先探索の弱点として正しいのは？",
          options: ["どんな地図でも一番遅い", "経路があっても見つけられないことがある", "ゴールに近づく方向を優先しすぎて、遠回りな経路を返すことがある", "沼のマスを通れない"],
          answer: 2,
          explain: "「コの字」の袋小路に吸い込まれるのが典型例。到達可能なら経路自体は見つかるが、その質に保証がない。実験レシピで再現できる。",
        },
      ]
    );
  });
})();
