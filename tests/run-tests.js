/*
 * コアロジック（js/algorithms.js）のユニットテスト
 * 実行: node tests/run-tests.js
 */
"use strict";

var path = require("path");
var Algo = require(path.join(__dirname, "..", "js", "algorithms.js"));

var failures = 0;
var total = 0;

function assert(cond, message) {
  total++;
  if (!cond) {
    failures++;
    console.error("  ✘ FAIL: " + message);
  }
}

function assertEqual(actual, expected, message) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    message + " — expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual)
  );
}

/* 再現性のための疑似乱数（LCG） */
var seed = 123456789;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function randomArray(n, maxVal) {
  var a = [];
  for (var i = 0; i < n; i++) a.push(randInt(1, maxVal));
  return a;
}

/* ===================== ソート ===================== */
console.log("[sorting]");

var sortCases = [
  [],
  [1],
  [2, 1],
  [1, 2],
  [3, 3, 3],
  [5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5],
  randomArray(20, 50),
  randomArray(53, 10), // 重複多め・奇数長
  randomArray(80, 1000),
];

Object.keys(Algo.SORTERS).forEach(function (name) {
  var sorter = Algo.SORTERS[name];
  sortCases.forEach(function (input, ci) {
    var expected = input.slice().sort(function (a, b) {
      return a - b;
    });
    var out = sorter(input);

    assertEqual(out.result, expected, name + " case#" + ci + " result がソート済み");
    assertEqual(input, sortCases[ci], name + " case#" + ci + " 入力配列を破壊しない");

    /* ops を replay した結果が result と一致し、全要素が sorted マークされる */
    var snapshot = Algo.replay(input, out.ops, out.ops.length - 1);
    assertEqual(snapshot.array, expected, name + " case#" + ci + " replay の最終状態が一致");
    var sortedCount = Object.keys(snapshot.sorted).length;
    assert(sortedCount === input.length, name + " case#" + ci + " 全要素が確定マーク (" + sortedCount + "/" + input.length + ")");

    /* ops の索引が範囲内 */
    var valid = out.ops.every(function (op) {
      if (op.t === "compare" || op.t === "swap") return op.i >= 0 && op.i < input.length && op.j >= 0 && op.j < input.length;
      if (op.t === "set" || op.t === "sorted") return op.i >= 0 && op.i < input.length;
      return true;
    });
    assert(valid, name + " case#" + ci + " ops の索引が範囲内");
  });
});

/* replay の途中状態: どのステップでも配列は元の多重集合の並べ替え（マージは書き戻し中に一時的に崩れるので除外） */
["bubble", "selection", "insertion", "shell", "quick", "heap"].forEach(function (name) {
  var input = randomArray(15, 30);
  var out = Algo.SORTERS[name](input);
  var sortedInput = input.slice().sort(function (a, b) {
    return a - b;
  });
  var ok = true;
  for (var s = 0; s < out.ops.length; s++) {
    var snap = Algo.replay(input, out.ops, s);
    var multiset = snap.array.slice().sort(function (a, b) {
      return a - b;
    });
    if (JSON.stringify(multiset) !== JSON.stringify(sortedInput)) {
      ok = false;
      break;
    }
  }
  assert(ok, name + " replay 途中状態が常に元の多重集合を保つ");
});

/* ===================== 二分探索 ===================== */
console.log("[binary search]");

var bsArr = [1, 3, 5, 7, 9, 11, 13];
assertEqual(Algo.binarySearchSteps(bsArr, 7).index, 3, "存在する値の index");
assertEqual(Algo.binarySearchSteps(bsArr, 1).index, 0, "先頭の値");
assertEqual(Algo.binarySearchSteps(bsArr, 13).index, 6, "末尾の値");
assertEqual(Algo.binarySearchSteps(bsArr, 4).index, -1, "存在しない値は -1");
assertEqual(Algo.binarySearchSteps([], 5).index, -1, "空配列は -1");
assertEqual(Algo.binarySearchSteps([], 5).steps.length, 0, "空配列はステップ 0");

for (var trial = 0; trial < 50; trial++) {
  var n = randInt(1, 100);
  var set = {};
  while (Object.keys(set).length < n) set[randInt(1, 500)] = true;
  var arr = Object.keys(set)
    .map(Number)
    .sort(function (a, b) {
      return a - b;
    });
  var target = rand() < 0.5 ? arr[randInt(0, arr.length - 1)] : randInt(1, 500);
  var res = Algo.binarySearchSteps(arr, target);
  var expectedIdx = arr.indexOf(target);
  assert(res.index === expectedIdx, "ランダム試行: index一致 (n=" + arr.length + ", target=" + target + ")");
  var maxSteps = Math.ceil(Math.log2(arr.length + 1)) + 1;
  assert(res.steps.length <= maxSteps, "ランダム試行: ステップ数 " + res.steps.length + " ≤ " + maxSteps);
}

/* ===================== MinHeap ===================== */
console.log("[min-heap]");

var heap = new Algo.MinHeap();
var values = [];
for (var i = 0; i < 200; i++) {
  var v = randInt(0, 1000);
  values.push(v);
  heap.push(v, v);
}
var popped = [];
while (heap.size() > 0) popped.push(heap.pop().p);
var sortedValues = values.slice().sort(function (a, b) {
  return a - b;
});
assertEqual(popped, sortedValues, "MinHeap は昇順に取り出される");

/* ===================== 経路探索 ===================== */
console.log("[pathfinding]");

function makeGrid(rows, cols, wallList, weightList, start, goal) {
  return {
    rows: rows,
    cols: cols,
    walls: new Set(wallList || []),
    weights: new Set(weightList || []),
    start: start,
    goal: goal,
  };
}

function validatePath(grid, path, label) {
  assert(path !== null, label + " 経路が存在する");
  if (!path) return;
  assertEqual(path[0], grid.start, label + " 経路の始点");
  assertEqual(path[path.length - 1], grid.goal, label + " 経路の終点");
  var ok = true;
  for (var i = 1; i < path.length; i++) {
    var dr = Math.abs(path[i][0] - path[i - 1][0]);
    var dc = Math.abs(path[i][1] - path[i - 1][1]);
    if (dr + dc !== 1) ok = false;
    if (grid.walls.has(path[i][0] + "," + path[i][1])) ok = false;
  }
  assert(ok, label + " 経路が連続していて壁を通らない");
}

/* 空グリッド: BFS の経路長 = マンハッタン距離 */
var g1 = makeGrid(10, 10, [], [], [0, 0], [9, 9]);
Object.keys(Algo.PATHFINDERS).forEach(function (name) {
  var r = Algo.PATHFINDERS[name](g1);
  validatePath(g1, r.path, name + " 空グリッド");
});
assert(Algo.PATHFINDERS.bfs(g1).path.length - 1 === 18, "BFS 空グリッドの経路長 = 18");
assert(Algo.PATHFINDERS.bfs(g1).cost === 18, "BFS 空グリッドのコスト = 18");
assert(Algo.PATHFINDERS.astar(g1).cost === 18, "A* 空グリッドのコスト = 18");

/* 完全に壁で塞ぐと経路なし */
var g2 = makeGrid(5, 5, ["0,2", "1,2", "2,2", "3,2", "4,2"], [], [2, 0], [2, 4]);
Object.keys(Algo.PATHFINDERS).forEach(function (name) {
  var r = Algo.PATHFINDERS[name](g2);
  assert(r.path === null, name + " 遮断時は経路なし");
  assert(r.cost === Infinity, name + " 遮断時のコストは Infinity");
});

/* 重み: ダイクストラは沼を迂回してコスト最小、BFS はマス数最小 */
/* 3x5: 中央行の直進路に沼を敷く */
var g3 = makeGrid(3, 5, [], ["1,1", "1,2", "1,3"], [1, 0], [1, 4]);
var bfsR = Algo.PATHFINDERS.bfs(g3);
var dijR = Algo.PATHFINDERS.dijkstra(g3);
var astR = Algo.PATHFINDERS.astar(g3);
assert(bfsR.path.length - 1 === 4, "BFS はマス数最短（4 マス）を選ぶ");
assert(bfsR.cost === 3 * Algo.WEIGHT_COST + 1, "BFS の経路は沼を突っ切りコスト " + (3 * Algo.WEIGHT_COST + 1));
assert(dijR.cost === 6, "ダイクストラは迂回してコスト 6");
assert(astR.cost === dijR.cost, "A* のコスト = ダイクストラのコスト");

/* ランダムグリッドで: A* とダイクストラのコストが常に一致、BFS 経路長 ≤ DFS 経路長 */
for (var t2 = 0; t2 < 30; t2++) {
  var rows = randInt(4, 12);
  var cols = randInt(4, 12);
  var wallList = [];
  var weightList = [];
  for (var r2 = 0; r2 < rows; r2++) {
    for (var c2 = 0; c2 < cols; c2++) {
      if (r2 === 0 && c2 === 0) continue;
      if (r2 === rows - 1 && c2 === cols - 1) continue;
      var roll = rand();
      if (roll < 0.25) wallList.push(r2 + "," + c2);
      else if (roll < 0.4) weightList.push(r2 + "," + c2);
    }
  }
  var g = makeGrid(rows, cols, wallList, weightList, [0, 0], [rows - 1, cols - 1]);
  var rb = Algo.PATHFINDERS.bfs(g);
  var rd = Algo.PATHFINDERS.dfs(g);
  var rdij = Algo.PATHFINDERS.dijkstra(g);
  var rast = Algo.PATHFINDERS.astar(g);
  var rgre = Algo.PATHFINDERS.greedy(g);

  var reachable = rb.path !== null;
  assert((rd.path !== null) === reachable, "試行" + t2 + ": DFS の到達可能性が BFS と一致");
  assert((rdij.path !== null) === reachable, "試行" + t2 + ": ダイクストラの到達可能性が BFS と一致");
  assert((rast.path !== null) === reachable, "試行" + t2 + ": A* の到達可能性が BFS と一致");
  assert((rgre.path !== null) === reachable, "試行" + t2 + ": 貪欲法の到達可能性が BFS と一致");

  if (reachable) {
    validatePath(g, rb.path, "試行" + t2 + " BFS");
    validatePath(g, rd.path, "試行" + t2 + " DFS");
    validatePath(g, rdij.path, "試行" + t2 + " dijkstra");
    validatePath(g, rast.path, "試行" + t2 + " A*");
    validatePath(g, rgre.path, "試行" + t2 + " greedy");
    assert(rast.cost === rdij.cost, "試行" + t2 + ": A* コスト(" + rast.cost + ") = ダイクストラコスト(" + rdij.cost + ")");
    assert(rdij.cost <= rb.cost, "試行" + t2 + ": ダイクストラのコスト ≤ BFS のコスト");
    assert(rgre.cost >= rdij.cost, "試行" + t2 + ": 貪欲法のコスト ≥ ダイクストラのコスト");
    assert(rb.path.length <= rd.path.length, "試行" + t2 + ": BFS の経路長 ≤ DFS の経路長");
    assert(rast.visitedOrder.length <= rdij.visitedOrder.length, "試行" + t2 + ": A* の探索数 ≤ ダイクストラの探索数");
  }
}

/* ===================== ハノイの塔 ===================== */
console.log("[hanoi]");

for (var hn = 1; hn <= 8; hn++) {
  var moves = Algo.hanoiMoves(hn);
  assert(moves.length === Math.pow(2, hn) - 1, "hanoi n=" + hn + " 手数 = 2^n - 1");
  /* シミュレーションで正当性を検証 */
  var pegs = [[], [], []];
  for (var d = hn; d >= 1; d--) pegs[0].push(d);
  var legal = true;
  moves.forEach(function (mv) {
    var src = pegs[mv.from];
    var dst = pegs[mv.to];
    if (src.length === 0 || src[src.length - 1] !== mv.disk) legal = false;
    if (dst.length > 0 && dst[dst.length - 1] < mv.disk) legal = false;
    dst.push(src.pop());
  });
  assert(legal, "hanoi n=" + hn + " すべての手が合法");
  assert(pegs[2].length === hn && pegs[0].length === 0, "hanoi n=" + hn + " 全円盤が右の杭に移動");
}

/* ===================== fib 呼び出しツリー ===================== */
console.log("[fib call tree]");

function fibVal(n) {
  var a = 0;
  var b = 1;
  for (var i = 0; i < n; i++) {
    var t = a + b;
    a = b;
    b = t;
  }
  return a;
}

for (var fn = 0; fn <= 12; fn++) {
  var naive = Algo.fibCallTree(fn, false);
  var memo = Algo.fibCallTree(fn, true);
  assert(naive.value === fibVal(fn), "fibTree n=" + fn + " 値が正しい");
  assert(naive.calls === 2 * fibVal(fn + 1) - 1, "fibTree n=" + fn + " 素朴版 calls = 2*fib(n+1)-1");
  assert(memo.value === fibVal(fn), "fibTree n=" + fn + " メモ化版の値が正しい");
  var expectedMemoCalls = fn <= 1 ? 1 : 2 * fn - 1;
  assert(memo.calls === expectedMemoCalls, "fibTree n=" + fn + " メモ化版 calls = " + expectedMemoCalls);
}

/* ===================== 文字列探索 ===================== */
console.log("[string search]");

function allOccurrences(text, pattern) {
  var out = [];
  var pos = text.indexOf(pattern);
  while (pos !== -1) {
    out.push(pos);
    pos = text.indexOf(pattern, pos + 1);
  }
  return out;
}

assertEqual(Algo.naiveSearchSteps("hello world", "o").found, [4, 7], "naive: 複数出現");
assertEqual(Algo.kmpSearchSteps("hello world", "o").found, [4, 7], "kmp: 複数出現");
assertEqual(Algo.naiveSearchSteps("aaaa", "aa").found, [0, 1, 2], "naive: 重なる出現");
assertEqual(Algo.kmpSearchSteps("aaaa", "aa").found, [0, 1, 2], "kmp: 重なる出現");
assertEqual(Algo.kmpFailure("ababaca"), [0, 0, 1, 2, 3, 0, 1], "失敗関数 ababaca");
assertEqual(Algo.kmpFailure("aaaa"), [0, 1, 2, 3], "失敗関数 aaaa");
assertEqual(Algo.naiveSearchSteps("abc", "abcd").found, [], "naive: パターンが長い場合は空");

for (var st = 0; st < 50; st++) {
  var tlen = randInt(5, 60);
  var plen = randInt(1, 4);
  var text = "";
  for (var ti = 0; ti < tlen; ti++) text += rand() < 0.5 ? "a" : "b";
  var pat = "";
  for (var pi = 0; pi < plen; pi++) pat += rand() < 0.5 ? "a" : "b";
  var expected2 = allOccurrences(text, pat);
  var nres = Algo.naiveSearchSteps(text, pat);
  var kres = Algo.kmpSearchSteps(text, pat);
  assertEqual(nres.found, expected2, "naive ランダム試行" + st);
  assertEqual(kres.found, expected2, "kmp ランダム試行" + st);
  assert(kres.comparisons <= 2 * text.length, "kmp 比較回数 ≤ 2n (試行" + st + ": " + kres.comparisons + ")");
}

/* 意地悪入力では KMP が総当たりより明確に少ない */
var advText = new Array(201).join("a"); /* "a" x 200 */
var advPat = "aaaaaaaaab";
var advNaive = Algo.naiveSearchSteps(advText, advPat);
var advKmp = Algo.kmpSearchSteps(advText, advPat);
assert(advNaive.found.length === 0 && advKmp.found.length === 0, "意地悪入力: 両者とも見つからない");
assert(advKmp.comparisons < advNaive.comparisons, "意地悪入力: KMP(" + advKmp.comparisons + ") < 総当たり(" + advNaive.comparisons + ")");

/* ===================== 動的計画法 ===================== */
console.log("[dp]");

/* コイン両替: 総当たり（枚数の全列挙）と一致するか */
function bruteMinCoins(coins, amount) {
  var best = Infinity;
  function rec(rest, count) {
    if (count >= best) return;
    if (rest === 0) {
      best = count;
      return;
    }
    for (var i = 0; i < coins.length; i++) {
      if (coins[i] <= rest) rec(rest - coins[i], count + 1);
    }
  }
  rec(amount, 0);
  return best;
}

var coinSets = [[1, 3, 4], [1, 5, 6], [2, 5], [3, 7]];
coinSets.forEach(function (coins, csIdx) {
  var res = Algo.coinChangeSteps(coins, 20);
  for (var amt = 0; amt <= 20; amt++) {
    var expected3 = bruteMinCoins(coins, amt);
    assert(res.dp[amt] === expected3, "coins" + csIdx + " 金額" + amt + ": dp=" + res.dp[amt] + " 期待=" + expected3);
  }
  assert(res.steps.length === 20, "coins" + csIdx + " steps は金額ぶんある");
});

/* ナップサック: 全部分集合の総当たりと一致するか */
var ksItems = [
  { name: "A", w: 2, v: 3 },
  { name: "B", w: 3, v: 4 },
  { name: "C", w: 4, v: 5 },
  { name: "D", w: 5, v: 6 },
];
function bruteKnapsack(items, cap) {
  var best = 0;
  var total = 1 << items.length;
  for (var mask = 0; mask < total; mask++) {
    var w = 0;
    var v = 0;
    for (var i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        w += items[i].w;
        v += items[i].v;
      }
    }
    if (w <= cap && v > best) best = v;
  }
  return best;
}
for (var cap = 0; cap <= 12; cap++) {
  var ks = Algo.knapsackSteps(ksItems, cap);
  assert(ks.best === bruteKnapsack(ksItems, cap), "knapsack cap=" + cap + " 最大価値が総当たりと一致");
  /* chosen の重さ・価値が整合しているか */
  var cw = 0;
  var cv = 0;
  ks.chosen.forEach(function (idx) {
    cw += ksItems[idx].w;
    cv += ksItems[idx].v;
  });
  assert(cw <= cap, "knapsack cap=" + cap + " 選択の重さが容量以内");
  assert(cv === ks.best, "knapsack cap=" + cap + " 選択の価値 = 最大価値");
}

/* ===================== ハッシュ ===================== */
console.log("[hash]");

var h1 = Algo.hashString("abc", 8);
assertEqual(h1.codes, [97, 98, 99], "hashString コード列");
assert(h1.sum === 294, "hashString 合計");
assert(h1.index === 294 % 8, "hashString インデックス");
for (var ht = 0; ht < 30; ht++) {
  var hs = "";
  var hlen = randInt(1, 10);
  for (var hi = 0; hi < hlen; hi++) hs += String.fromCharCode(randInt(97, 122));
  var hres = Algo.hashString(hs, 8);
  assert(hres.index >= 0 && hres.index < 8, "hashString 範囲内 (" + hs + ")");
  assert(hres.index === Algo.hashString(hs, 8).index, "hashString 決定的 (" + hs + ")");
}

/* ===================== 結果 ===================== */
console.log("");
if (failures === 0) {
  console.log("✔ ALL " + total + " assertions passed");
  process.exit(0);
} else {
  console.error("✘ " + failures + " / " + total + " assertions FAILED");
  process.exit(1);
}
