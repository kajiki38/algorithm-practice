/*
 * アルゴリズム道場 — コアロジック（純粋関数のみ）
 *
 * DOM に依存しないため、ブラウザ（window.Algo）と Node.js（module.exports）の
 * 両方から利用できる。ユニットテストは tests/run-tests.js を参照。
 *
 * ソートの各関数は「操作列（ops）」を返す。UI 側は初期配列に ops を順に
 * 適用して任意のステップの状態を再現する。
 *   { t: "compare", i, j, line }  … a[i] と a[j] を比較
 *   { t: "swap",    i, j, line }  … a[i] と a[j] を交換
 *   { t: "set",     i, v, line }  … a[i] = v（マージソートの書き戻し）
 *   { t: "sorted",  i }           … i 番目の位置が確定
 *   { t: "pivot",   i, line }     … ピボットの位置（クイックソート）
 *   { t: "range",   lo, hi, line }… 現在処理中の部分配列
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Algo = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ============================ ソート ============================ */

  var PSEUDO = {
    bubble: [
      "for i in 0 .. n-2:",
      "  for j in 0 .. n-2-i:",
      "    if a[j] > a[j+1]:",
      "      swap(a[j], a[j+1])",
      "  # 各周回で最大値が右端に確定",
    ],
    selection: [
      "for i in 0 .. n-2:",
      "  min = i",
      "  for j in i+1 .. n-1:",
      "    if a[j] < a[min]: min = j",
      "  swap(a[i], a[min])  # i 番目が確定",
    ],
    insertion: [
      "for i in 1 .. n-1:",
      "  j = i",
      "  while j > 0 and a[j-1] > a[j]:",
      "    swap(a[j-1], a[j])",
      "    j = j - 1",
    ],
    quick: [
      "quicksort(lo, hi):",
      "  if lo >= hi: return",
      "  pivot = a[hi]",
      "  i = lo",
      "  for j in lo .. hi-1:",
      "    if a[j] < pivot:",
      "      swap(a[i], a[j]); i += 1",
      "  swap(a[i], a[hi])  # ピボット確定",
      "  quicksort(lo, i-1); quicksort(i+1, hi)",
    ],
    merge: [
      "mergesort(lo, hi):",
      "  if hi <= lo: return",
      "  mid = (lo + hi) // 2",
      "  mergesort(lo, mid); mergesort(mid+1, hi)",
      "  # 左右のソート済み区間をマージ",
      "  小さい方の先頭を取り出して",
      "  a[k] に書き戻す",
    ],
    heap: [
      "heapsort(a):",
      "  # 後ろ半分から sift-down して最大ヒープを構築",
      "  for i in n//2-1 .. 0: sift_down(i, n)",
      "  for end in n-1 .. 1:",
      "    swap(a[0], a[end])  # 最大値を右端に確定",
      "    sift_down(0, end)  # 根を沈め直す",
      "  # sift_down: 大きい方の子と交換しながら沈める",
    ],
    shell: [
      "gap = n // 2",
      "while gap > 0:",
      "  for i in gap .. n-1:",
      "    j = i  # gap 間隔の挿入ソート",
      "    while j >= gap and a[j-gap] > a[j]:",
      "      swap(a[j-gap], a[j]); j -= gap",
      "  gap = gap // 2",
    ],
  };

  function bubbleSortSteps(arr) {
    var a = arr.slice();
    var ops = [];
    var n = a.length;
    for (var i = 0; i < n - 1; i++) {
      for (var j = 0; j < n - 1 - i; j++) {
        ops.push({ t: "compare", i: j, j: j + 1, line: 2 });
        if (a[j] > a[j + 1]) {
          var tmp = a[j];
          a[j] = a[j + 1];
          a[j + 1] = tmp;
          ops.push({ t: "swap", i: j, j: j + 1, line: 3 });
        }
      }
      ops.push({ t: "sorted", i: n - 1 - i, line: 4 });
    }
    if (n > 0) ops.push({ t: "sorted", i: 0, line: 4 });
    return { ops: ops, result: a };
  }

  function selectionSortSteps(arr) {
    var a = arr.slice();
    var ops = [];
    var n = a.length;
    for (var i = 0; i < n - 1; i++) {
      var min = i;
      for (var j = i + 1; j < n; j++) {
        ops.push({ t: "compare", i: j, j: min, line: 3 });
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) {
        var tmp = a[i];
        a[i] = a[min];
        a[min] = tmp;
        ops.push({ t: "swap", i: i, j: min, line: 4 });
      }
      ops.push({ t: "sorted", i: i, line: 4 });
    }
    if (n > 0) ops.push({ t: "sorted", i: n - 1, line: 4 });
    return { ops: ops, result: a };
  }

  function insertionSortSteps(arr) {
    var a = arr.slice();
    var ops = [];
    var n = a.length;
    for (var i = 1; i < n; i++) {
      var j = i;
      while (j > 0) {
        ops.push({ t: "compare", i: j - 1, j: j, line: 2 });
        if (a[j - 1] <= a[j]) break;
        var tmp = a[j - 1];
        a[j - 1] = a[j];
        a[j] = tmp;
        ops.push({ t: "swap", i: j - 1, j: j, line: 3 });
        j--;
      }
    }
    for (var k = 0; k < n; k++) ops.push({ t: "sorted", i: k });
    return { ops: ops, result: a };
  }

  function quickSortSteps(arr) {
    var a = arr.slice();
    var ops = [];

    function swap(x, y, line) {
      if (x === y) return;
      var tmp = a[x];
      a[x] = a[y];
      a[y] = tmp;
      ops.push({ t: "swap", i: x, j: y, line: line });
    }

    function qs(lo, hi) {
      if (lo >= hi) {
        if (lo === hi) ops.push({ t: "sorted", i: lo, line: 1 });
        return;
      }
      ops.push({ t: "range", lo: lo, hi: hi, line: 0 });
      ops.push({ t: "pivot", i: hi, line: 2 });
      var i = lo;
      for (var j = lo; j < hi; j++) {
        ops.push({ t: "compare", i: j, j: hi, line: 5 });
        if (a[j] < a[hi]) {
          swap(i, j, 6);
          i++;
        }
      }
      swap(i, hi, 7);
      ops.push({ t: "sorted", i: i, line: 7 });
      qs(lo, i - 1);
      qs(i + 1, hi);
    }

    if (a.length > 0) qs(0, a.length - 1);
    ops.push({ t: "range", lo: -1, hi: -1 });
    ops.push({ t: "pivot", i: -1 });
    return { ops: ops, result: a };
  }

  function mergeSortSteps(arr) {
    var a = arr.slice();
    var ops = [];

    function ms(lo, hi) {
      if (hi <= lo) return;
      var mid = Math.floor((lo + hi) / 2);
      ms(lo, mid);
      ms(mid + 1, hi);

      ops.push({ t: "range", lo: lo, hi: hi, line: 4 });
      var left = a.slice(lo, mid + 1);
      var right = a.slice(mid + 1, hi + 1);
      var i = 0;
      var j = 0;
      var k = lo;
      while (i < left.length && j < right.length) {
        /* 比較対象の「現在の位置」を可視化用に示す */
        ops.push({ t: "compare", i: lo + i, j: mid + 1 + j, line: 5 });
        if (left[i] <= right[j]) {
          a[k] = left[i];
          ops.push({ t: "set", i: k, v: left[i], line: 6 });
          i++;
        } else {
          a[k] = right[j];
          ops.push({ t: "set", i: k, v: right[j], line: 6 });
          j++;
        }
        k++;
      }
      while (i < left.length) {
        a[k] = left[i];
        ops.push({ t: "set", i: k, v: left[i], line: 6 });
        i++;
        k++;
      }
      while (j < right.length) {
        a[k] = right[j];
        ops.push({ t: "set", i: k, v: right[j], line: 6 });
        j++;
        k++;
      }
    }

    ms(0, a.length - 1);
    ops.push({ t: "range", lo: -1, hi: -1 });
    for (var m = 0; m < a.length; m++) ops.push({ t: "sorted", i: m });
    return { ops: ops, result: a };
  }

  function heapSortSteps(arr) {
    var a = arr.slice();
    var ops = [];
    var n = a.length;

    function swap(x, y, line) {
      if (x === y) return;
      var tmp = a[x];
      a[x] = a[y];
      a[y] = tmp;
      ops.push({ t: "swap", i: x, j: y, line: line });
    }

    function siftDown(i, size, line) {
      for (;;) {
        var l = 2 * i + 1;
        var r = 2 * i + 2;
        var big = i;
        if (l < size) {
          ops.push({ t: "compare", i: l, j: big, line: 6 });
          if (a[l] > a[big]) big = l;
        }
        if (r < size) {
          ops.push({ t: "compare", i: r, j: big, line: 6 });
          if (a[r] > a[big]) big = r;
        }
        if (big === i) return;
        swap(i, big, line);
        i = big;
      }
    }

    for (var i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n, 2);
    for (var end = n - 1; end >= 1; end--) {
      swap(0, end, 4);
      ops.push({ t: "sorted", i: end, line: 4 });
      siftDown(0, end, 5);
    }
    if (n > 0) ops.push({ t: "sorted", i: 0, line: 5 });
    return { ops: ops, result: a };
  }

  function shellSortSteps(arr) {
    var a = arr.slice();
    var ops = [];
    var n = a.length;
    var gap = Math.floor(n / 2);
    while (gap > 0) {
      for (var i = gap; i < n; i++) {
        var j = i;
        while (j >= gap) {
          ops.push({ t: "compare", i: j - gap, j: j, line: 4 });
          if (a[j - gap] <= a[j]) break;
          var tmp = a[j - gap];
          a[j - gap] = a[j];
          a[j] = tmp;
          ops.push({ t: "swap", i: j - gap, j: j, line: 5 });
          j -= gap;
        }
      }
      gap = Math.floor(gap / 2);
    }
    for (var k = 0; k < n; k++) ops.push({ t: "sorted", i: k });
    return { ops: ops, result: a };
  }

  var SORTERS = {
    bubble: bubbleSortSteps,
    selection: selectionSortSteps,
    insertion: insertionSortSteps,
    shell: shellSortSteps,
    quick: quickSortSteps,
    merge: mergeSortSteps,
    heap: heapSortSteps,
  };

  /*
   * 操作列を初期配列に適用し、ステップ upto（そのステップを含む）までの
   * 状態を返す。UI の「1ステップ戻る」はこの関数で任意時点を再現する。
   */
  function replay(initial, ops, upto) {
    var a = initial.slice();
    var sorted = {};
    var pivot = -1;
    var range = null;
    var highlight = null;
    var comparisons = 0;
    var writes = 0;

    var end = Math.min(upto, ops.length - 1);
    for (var k = 0; k <= end; k++) {
      var op = ops[k];
      switch (op.t) {
        case "compare":
          comparisons++;
          break;
        case "swap":
          var tmp = a[op.i];
          a[op.i] = a[op.j];
          a[op.j] = tmp;
          writes++;
          break;
        case "set":
          a[op.i] = op.v;
          writes++;
          break;
        case "sorted":
          sorted[op.i] = true;
          break;
        case "pivot":
          pivot = op.i;
          break;
        case "range":
          range = op.lo < 0 ? null : { lo: op.lo, hi: op.hi };
          break;
      }
      if (k === end) highlight = op;
    }
    return {
      array: a,
      sorted: sorted,
      pivot: pivot,
      range: range,
      highlight: highlight,
      comparisons: comparisons,
      writes: writes,
    };
  }

  /* ========================== 二分探索 ========================== */

  /*
   * ソート済み配列 arr から target を探し、各反復の状態を返す。
   * steps: [{ lo, hi, mid, cmp }] cmp は "found" | "go-right" | "go-left"
   */
  function binarySearchSteps(arr, target) {
    var steps = [];
    var lo = 0;
    var hi = arr.length - 1;
    var found = -1;
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2);
      var cmp;
      if (arr[mid] === target) {
        cmp = "found";
        found = mid;
      } else if (arr[mid] < target) {
        cmp = "go-right";
      } else {
        cmp = "go-left";
      }
      steps.push({ lo: lo, hi: hi, mid: mid, cmp: cmp });
      if (cmp === "found") break;
      if (cmp === "go-right") lo = mid + 1;
      else hi = mid - 1;
    }
    return { steps: steps, index: found };
  }

  /* ========================== 経路探索 ========================== */

  /*
   * グリッド: rows × cols。walls / weights は "r,c" 文字列の Set。
   * weights のマスは通行コスト WEIGHT_COST（それ以外は 1）。
   * 返り値: { visitedOrder: [[r,c],...], path: [[r,c],...] | null, cost }
   * visitedOrder は「確定（展開）した順」。
   */
  var WEIGHT_COST = 5;

  function key(r, c) {
    return r + "," + c;
  }

  var DIRS = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  function neighbors(r, c, rows, cols, walls) {
    var out = [];
    for (var d = 0; d < DIRS.length; d++) {
      var nr = r + DIRS[d][0];
      var nc = c + DIRS[d][1];
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (walls.has(key(nr, nc))) continue;
      out.push([nr, nc]);
    }
    return out;
  }

  function reconstruct(parent, goalKey) {
    var path = [];
    var cur = goalKey;
    while (cur !== null && cur !== undefined) {
      var parts = cur.split(",");
      path.push([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
      cur = parent[cur];
    }
    path.reverse();
    return path;
  }

  function pathCost(path, weights) {
    /* スタート地点はコストに含めない（移動先マスのコストを加算） */
    var cost = 0;
    for (var i = 1; i < path.length; i++) {
      cost += weights.has(key(path[i][0], path[i][1])) ? WEIGHT_COST : 1;
    }
    return cost;
  }

  function bfs(grid) {
    var start = grid.start;
    var goal = grid.goal;
    var startKey = key(start[0], start[1]);
    var goalKey = key(goal[0], goal[1]);
    var queue = [start];
    var parent = {};
    parent[startKey] = null;
    var visitedOrder = [];
    var head = 0;
    while (head < queue.length) {
      var cur = queue[head++];
      var curKey = key(cur[0], cur[1]);
      visitedOrder.push(cur);
      if (curKey === goalKey) {
        var path = reconstruct(parent, goalKey);
        return { visitedOrder: visitedOrder, path: path, cost: pathCost(path, grid.weights) };
      }
      var nbs = neighbors(cur[0], cur[1], grid.rows, grid.cols, grid.walls);
      for (var i = 0; i < nbs.length; i++) {
        var nk = key(nbs[i][0], nbs[i][1]);
        if (!(nk in parent)) {
          parent[nk] = curKey;
          queue.push(nbs[i]);
        }
      }
    }
    return { visitedOrder: visitedOrder, path: null, cost: Infinity };
  }

  function dfs(grid) {
    var start = grid.start;
    var goal = grid.goal;
    var startKey = key(start[0], start[1]);
    var goalKey = key(goal[0], goal[1]);
    var stack = [start];
    var parent = {};
    parent[startKey] = null;
    var visited = {};
    var visitedOrder = [];
    while (stack.length > 0) {
      var cur = stack.pop();
      var curKey = key(cur[0], cur[1]);
      if (visited[curKey]) continue;
      visited[curKey] = true;
      visitedOrder.push(cur);
      if (curKey === goalKey) {
        var path = reconstruct(parent, goalKey);
        return { visitedOrder: visitedOrder, path: path, cost: pathCost(path, grid.weights) };
      }
      var nbs = neighbors(cur[0], cur[1], grid.rows, grid.cols, grid.walls);
      /* 上→右→下→左 の順で探索されるよう逆順に積む */
      for (var i = nbs.length - 1; i >= 0; i--) {
        var nk = key(nbs[i][0], nbs[i][1]);
        if (!visited[nk]) {
          if (!(nk in parent)) parent[nk] = curKey;
          stack.push(nbs[i]);
        }
      }
    }
    return { visitedOrder: visitedOrder, path: null, cost: Infinity };
  }

  /* 最小ヒープ（優先度付きキュー） */
  function MinHeap() {
    this.items = [];
  }
  MinHeap.prototype.push = function (priority, value) {
    var items = this.items;
    items.push({ p: priority, v: value });
    var i = items.length - 1;
    while (i > 0) {
      var parent = (i - 1) >> 1;
      if (items[parent].p <= items[i].p) break;
      var tmp = items[parent];
      items[parent] = items[i];
      items[i] = tmp;
      i = parent;
    }
  };
  MinHeap.prototype.pop = function () {
    var items = this.items;
    if (items.length === 0) return null;
    var top = items[0];
    var last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      var i = 0;
      for (;;) {
        var l = 2 * i + 1;
        var r = 2 * i + 2;
        var smallest = i;
        if (l < items.length && items[l].p < items[smallest].p) smallest = l;
        if (r < items.length && items[r].p < items[smallest].p) smallest = r;
        if (smallest === i) break;
        var tmp = items[smallest];
        items[smallest] = items[i];
        items[i] = tmp;
        i = smallest;
      }
    }
    return top;
  };
  MinHeap.prototype.size = function () {
    return this.items.length;
  };

  function cellCost(r, c, weights) {
    return weights.has(key(r, c)) ? WEIGHT_COST : 1;
  }

  /*
   * 優先度付きキューを使う 3 手法を 1 つの実装で切り替える。
   *   dijkstra: 優先度 = 確定コスト g
   *   astar:    優先度 = g + h（ヒューリスティック）
   *   greedy:   優先度 = h のみ（貪欲最良優先。最短保証なし・発見即確定）
   */
  function weightedSearch(grid, mode) {
    var start = grid.start;
    var goal = grid.goal;
    var startKey = key(start[0], start[1]);
    var goalKey = key(goal[0], goal[1]);
    var dist = {};
    dist[startKey] = 0;
    var parent = {};
    parent[startKey] = null;
    var done = {};
    var visitedOrder = [];
    var heap = new MinHeap();

    function h(r, c) {
      return Math.abs(r - goal[0]) + Math.abs(c - goal[1]);
    }

    function priority(g, r, c) {
      if (mode === "greedy") return h(r, c);
      if (mode === "astar") return g + h(r, c);
      return g;
    }

    heap.push(priority(0, start[0], start[1]), start);
    while (heap.size() > 0) {
      var cur = heap.pop().v;
      var curKey = key(cur[0], cur[1]);
      if (done[curKey]) continue;
      done[curKey] = true;
      visitedOrder.push(cur);
      if (curKey === goalKey) {
        var path = reconstruct(parent, goalKey);
        return { visitedOrder: visitedOrder, path: path, cost: pathCost(path, grid.weights) };
      }
      var nbs = neighbors(cur[0], cur[1], grid.rows, grid.cols, grid.walls);
      for (var i = 0; i < nbs.length; i++) {
        var nr = nbs[i][0];
        var nc = nbs[i][1];
        var nk = key(nr, nc);
        if (done[nk]) continue;
        var nd = dist[curKey] + cellCost(nr, nc, grid.weights);
        if (mode === "greedy") {
          /* 貪欲法は「最初に見つけた経路」を使い、より安い経路で更新しない */
          if (!(nk in dist)) {
            dist[nk] = nd;
            parent[nk] = curKey;
            heap.push(h(nr, nc), nbs[i]);
          }
        } else if (!(nk in dist) || nd < dist[nk]) {
          dist[nk] = nd;
          parent[nk] = curKey;
          heap.push(priority(nd, nr, nc), nbs[i]);
        }
      }
    }
    return { visitedOrder: visitedOrder, path: null, cost: Infinity };
  }

  function dijkstra(grid) {
    return weightedSearch(grid, "dijkstra");
  }

  function astar(grid) {
    return weightedSearch(grid, "astar");
  }

  function greedy(grid) {
    return weightedSearch(grid, "greedy");
  }

  var PATHFINDERS = { bfs: bfs, dfs: dfs, dijkstra: dijkstra, astar: astar, greedy: greedy };

  /* ========================== 再帰・分割統治 ========================== */

  /* ハノイの塔の最短手順（手数 = 2^n − 1）。杭は 0, 1, 2。 */
  function hanoiMoves(n) {
    var moves = [];
    function solve(k, from, to, aux) {
      if (k === 0) return;
      solve(k - 1, from, aux, to);
      moves.push({ from: from, to: to, disk: k });
      solve(k - 1, aux, to, from);
    }
    solve(n, 0, 2, 1);
    return moves;
  }

  /*
   * fib(n) の呼び出しツリー。memoized=true ならメモ化ありで構築し、
   * キャッシュヒットしたノードは cached=true（子を展開しない）。
   * 素朴版の calls は 2*fib(n+1) − 1 になる。
   */
  function fibCallTree(n, memoized) {
    var calls = 0;
    var memo = {};
    function build(k) {
      calls++;
      var node = { n: k, cached: false, children: [] };
      if (memoized && memo[k] !== undefined) {
        node.cached = true;
        node.value = memo[k];
        return node;
      }
      if (k <= 1) {
        node.value = k;
      } else {
        var a = build(k - 1);
        var b = build(k - 2);
        node.children = [a, b];
        node.value = a.value + b.value;
      }
      if (memoized) memo[k] = node.value;
      return node;
    }
    var tree = build(n);
    return { tree: tree, calls: calls, value: tree.value };
  }

  /* ========================== 文字列探索 ========================== */

  /*
   * 総当たり法。steps は 1 比較ごとに { shift, j, match }。
   * shift = パターンの左端をテキストのどこに合わせているか。
   */
  function naiveSearchSteps(text, pattern) {
    var steps = [];
    var found = [];
    var comparisons = 0;
    var n = text.length;
    var m = pattern.length;
    if (m === 0 || m > n) return { steps: steps, found: found, comparisons: 0 };
    for (var s = 0; s + m <= n; s++) {
      var ok = true;
      for (var j = 0; j < m; j++) {
        comparisons++;
        var match = text.charAt(s + j) === pattern.charAt(j);
        steps.push({ shift: s, j: j, match: match });
        if (!match) {
          ok = false;
          break;
        }
      }
      if (ok) found.push(s);
    }
    return { steps: steps, found: found, comparisons: comparisons };
  }

  /* KMP の失敗関数（各位置での最長の「真の接頭辞＝接尾辞」長） */
  function kmpFailure(pattern) {
    var m = pattern.length;
    var f = [];
    for (var x = 0; x < m; x++) f.push(0);
    var k = 0;
    for (var i = 1; i < m; i++) {
      while (k > 0 && pattern.charAt(i) !== pattern.charAt(k)) k = f[k - 1];
      if (pattern.charAt(i) === pattern.charAt(k)) k++;
      f[i] = k;
    }
    return f;
  }

  /* KMP 法。steps の形式は naiveSearchSteps と同じ（shift = i − j）。 */
  function kmpSearchSteps(text, pattern) {
    var m = pattern.length;
    var n = text.length;
    var failure = kmpFailure(pattern);
    var steps = [];
    var found = [];
    var comparisons = 0;
    if (m === 0 || m > n) return { steps: steps, found: found, comparisons: 0, failure: failure };
    var k = 0;
    for (var i = 0; i < n; i++) {
      for (;;) {
        comparisons++;
        var match = text.charAt(i) === pattern.charAt(k);
        steps.push({ shift: i - k, j: k, match: match });
        if (match) {
          k++;
          break;
        }
        if (k === 0) break;
        k = failure[k - 1];
      }
      if (k === m) {
        found.push(i - m + 1);
        k = failure[k - 1];
      }
    }
    return { steps: steps, found: found, comparisons: comparisons, failure: failure };
  }

  /* ========================== 動的計画法 ========================== */

  /*
   * コイン両替（最少枚数）。dp[i] = 金額 i を作る最少枚数（不可能は Infinity）。
   * steps[i-1] = { i, candidates: [{coin, from, value}], value, coin }
   */
  function coinChangeSteps(coins, amount) {
    var dp = [0];
    var pick = [-1];
    var steps = [];
    for (var i = 1; i <= amount; i++) {
      var best = Infinity;
      var bestCoin = -1;
      var candidates = [];
      for (var c = 0; c < coins.length; c++) {
        var coin = coins[c];
        if (coin <= i && dp[i - coin] !== Infinity) {
          var v = dp[i - coin] + 1;
          candidates.push({ coin: coin, from: i - coin, value: v });
          if (v < best) {
            best = v;
            bestCoin = coin;
          }
        }
      }
      dp[i] = best;
      pick[i] = bestCoin;
      steps.push({ i: i, candidates: candidates, value: best, coin: bestCoin });
    }
    return { dp: dp, pick: pick, steps: steps };
  }

  /*
   * 0/1 ナップサック。items = [{name, w, v}]。
   * table[i][w] = 品物 1..i から選んで容量 w のときの最大価値。
   */
  function knapsackSteps(items, capacity) {
    var n = items.length;
    var table = [];
    for (var i = 0; i <= n; i++) {
      var row = [];
      for (var w = 0; w <= capacity; w++) row.push(0);
      table.push(row);
    }
    var steps = [];
    for (var i2 = 1; i2 <= n; i2++) {
      var it = items[i2 - 1];
      for (var w2 = 0; w2 <= capacity; w2++) {
        var skip = table[i2 - 1][w2];
        var take = it.w <= w2 ? table[i2 - 1][w2 - it.w] + it.v : -1;
        table[i2][w2] = Math.max(skip, take);
        steps.push({ i: i2, w: w2, skip: skip, take: take, taken: take > skip });
      }
    }
    /* どの品物を選んだかを逆から辿る */
    var chosen = [];
    var wLeft = capacity;
    for (var i3 = n; i3 >= 1; i3--) {
      if (table[i3][wLeft] !== table[i3 - 1][wLeft]) {
        chosen.push(i3 - 1);
        wLeft -= items[i3 - 1].w;
      }
    }
    chosen.reverse();
    return { table: table, steps: steps, chosen: chosen, best: table[n][capacity] };
  }

  /* ========================== ハッシュ ========================== */

  /* 文字コードの和を バケツ数 で割った余り。計算過程ごと返す（可視化用） */
  function hashString(s, buckets) {
    var codes = [];
    var sum = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      codes.push(c);
      sum += c;
    }
    return { codes: codes, sum: sum, index: buckets > 0 ? sum % buckets : 0 };
  }

  return {
    PSEUDO: PSEUDO,
    SORTERS: SORTERS,
    replay: replay,
    binarySearchSteps: binarySearchSteps,
    PATHFINDERS: PATHFINDERS,
    WEIGHT_COST: WEIGHT_COST,
    MinHeap: MinHeap,
    gridKey: key,
    hanoiMoves: hanoiMoves,
    fibCallTree: fibCallTree,
    naiveSearchSteps: naiveSearchSteps,
    kmpFailure: kmpFailure,
    kmpSearchSteps: kmpSearchSteps,
    coinChangeSteps: coinChangeSteps,
    knapsackSteps: knapsackSteps,
    hashString: hashString,
  };
});
