/* Python 実践ページ（Pyodide） */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  var WARN_ICO = '<span class="ico ico-warn" style="color:var(--warn);vertical-align:-2px"></span>';

  /* ---------------- 問題定義（学習モジュールの順に並ぶ） ---------------- */
  var PROBLEMS = [
    {
      id: "sum_list",
      title: "1. ウォームアップ: 合計",
      func: "sum_list",
      desc:
        "整数のリスト <code>nums</code> を受け取り、合計を返す関数 <code>sum_list(nums)</code> を書こう。" +
        "<br>まずは <b>for ループ</b>で。慣れたら組み込みの <code>sum()</code> でも OK。空リストなら 0 を返すこと。",
      starter: "def sum_list(nums):\n    # ここに実装する\n    total = 0\n    return total\n",
      tests: [
        { args: [[1, 2, 3, 4, 5]], expected: 15 },
        { args: [[]], expected: 0 },
        { args: [[-10, 10, 3]], expected: 3 },
        { args: [[42]], expected: 42 },
      ],
      hints: ["for x in nums: で各要素を順に取り出せる。", "total に足し込んでいき、最後に return total。"],
      solution: "def sum_list(nums):\n    total = 0\n    for x in nums:\n        total += x\n    return total",
    },
    {
      id: "fizzbuzz",
      title: "2. FizzBuzz",
      func: "fizzbuzz",
      desc:
        "1 から <code>n</code> までの数について、3 の倍数なら <code>\"Fizz\"</code>、5 の倍数なら <code>\"Buzz\"</code>、" +
        "両方の倍数なら <code>\"FizzBuzz\"</code>、それ以外はその数を<b>文字列で</b>入れたリストを返す <code>fizzbuzz(n)</code> を書こう。" +
        "<br>例: <code>fizzbuzz(5)</code> → <code>[\"1\", \"2\", \"Fizz\", \"4\", \"Buzz\"]</code>",
      starter: "def fizzbuzz(n):\n    result = []\n    # ここに実装する\n    return result\n",
      tests: [
        { args: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
        { args: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"] },
        { args: [1], expected: ["1"] },
        { args: [0], expected: [] },
      ],
      hints: [
        "判定の順番が大事。「15 の倍数（= 3 と 5 両方）」を最初にチェックしないと Fizz が先に当たってしまう。",
        "数値を文字列にするのは str(i)。range(1, n + 1) で 1 から n まで。",
      ],
      solution:
        "def fizzbuzz(n):\n    result = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            result.append(\"FizzBuzz\")\n        elif i % 3 == 0:\n            result.append(\"Fizz\")\n        elif i % 5 == 0:\n            result.append(\"Buzz\")\n        else:\n            result.append(str(i))\n    return result",
    },
    {
      id: "linear_search",
      title: "3. 線形探索",
      func: "linear_search",
      desc:
        "リスト <code>a</code> を先頭から順に調べて、<code>x</code> が<b>最初に現れるインデックス</b>を返す " +
        "<code>linear_search(a, x)</code> を書こう。見つからなければ <code>-1</code>。" +
        "<br>探索の原点。このあと二分探索・ハッシュと比べて「前から全部見る」コスト O(n) を体感する基準になる。" +
        "<code>a.index(x)</code> は使わず自分でループを書くこと（武士の誓い）。",
      starter: "def linear_search(a, x):\n    # ここに実装する\n    return -1\n",
      tests: [
        { args: [[5, 3, 8, 3], 3], expected: 1 },
        { args: [[1, 2, 3], 9], expected: -1 },
        { args: [[], 1], expected: -1 },
        { args: [[7], 7], expected: 0 },
        { args: [[4, 4, 4], 4], expected: 0 },
      ],
      hints: ["for i in range(len(a)): で添字を回すか、for i, v in enumerate(a): が便利。", "見つけた瞬間に return i すれば「最初の」インデックスになる。"],
      solution: "def linear_search(a, x):\n    for i, v in enumerate(a):\n        if v == x:\n            return i\n    return -1",
    },
    {
      id: "valid_brackets",
      title: "4. 括弧の対応チェック（スタック）",
      func: "valid_brackets",
      desc:
        "<code>()[]{}</code> だけからなる文字列 <code>s</code> が「正しく対応している」なら <code>True</code>、" +
        "そうでなければ <code>False</code> を返す <code>valid_brackets(s)</code> を書こう。空文字列は <code>True</code>。" +
        "<br>例: <code>\"([{}])\"</code> → True、<code>\"([)]\"</code> → False" +
        "<br>データ構造ページで触った<b>スタック</b>の代表的な応用。「最後に開いた括弧が最初に閉じられる」= LIFO そのもの。",
      starter: "def valid_brackets(s):\n    stack = []\n    # ここに実装する\n    return True\n",
      tests: [
        { args: ["()"], expected: true },
        { args: ["([{}])"], expected: true },
        { args: ["(]"], expected: false },
        { args: ["(("], expected: false },
        { args: [""], expected: true },
        { args: ["([)]"], expected: false },
        { args: [")("], expected: false },
      ],
      hints: [
        "開き括弧はスタックに push（append）。閉じ括弧が来たら pop して、対応する開き括弧か確かめる。",
        "閉じ括弧なのにスタックが空なら False。全部見終わってスタックに残っていても False。",
        "対応表は pairs = {\")\": \"(\", \"]\": \"[\", \"}\": \"{\"} のような dict が便利。",
      ],
      solution:
        "def valid_brackets(s):\n    pairs = {\")\": \"(\", \"]\": \"[\", \"}\": \"{\"}\n    stack = []\n    for ch in s:\n        if ch in \"([{\":\n            stack.append(ch)\n        else:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return len(stack) == 0",
    },
    {
      id: "two_sum",
      title: "5. Two Sum（ハッシュの威力）",
      func: "two_sum",
      desc:
        "リスト <code>nums</code> の中から<b>足すと <code>target</code> になる 2 つの要素</b>を見つけ、" +
        "その 2 つのインデックスを<b>小さい順に並べたリスト</b>で返す <code>two_sum(nums, target)</code> を書こう。答えは必ず 1 組だけ存在する。" +
        "<br>例: <code>two_sum([2, 7, 11, 15], 9)</code> → <code>[0, 1]</code>" +
        "<br>二重ループ O(n²) でも解けるが、<b>dict を使えば O(n)</b> で解ける。" +
        WARN_ICO +
        " 最後のテストは要素数 20 万。O(n²) だと約 200 億回の比較になり<b>タブが固まる</b>ので、必ず O(n) にしてから実行しよう。",
      starter: "def two_sum(nums, target):\n    # ここに実装する\n    return [0, 0]\n",
      tests: [
        { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { args: [[3, 2, 4], 6], expected: [1, 2] },
        { args: [[-5, 12, 3, 5], 0], expected: [0, 3] },
        { args: ["__BIG_TWO_SUM__"], expected: [99999, 100000] },
      ],
      hints: [
        "「今見ている数 x の相方は target - x」と考える。",
        "seen = {} を用意し、値 → インデックス を記録しながら 1 回だけループする。",
        "相方 (target - x) がすでに seen にあれば、[seen[target - x], 今のインデックス] が答え。",
      ],
      solution:
        "def two_sum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        rest = target - x\n        if rest in seen:\n            return [seen[rest], i]\n        seen[x] = i\n    return [-1, -1]",
    },
    {
      id: "bubble_sort",
      title: "6. バブルソートを実装する",
      func: "bubble_sort",
      desc:
        "リスト <code>nums</code> を昇順に並べ替えた<b>新しいリスト</b>を返す <code>bubble_sort(nums)</code> を、" +
        "バブルソートで実装しよう（<code>sorted()</code> / <code>.sort()</code> 禁止。これも武士の誓い）。" +
        "<br>「ソート可視化」ページの動きを思い出して: 隣同士を比べて、逆順なら交換。それを繰り返すだけ。" +
        "<br>おまけ課題: 交換が 1 回も起きなかった周回で打ち切る「早期終了」を入れると、整列済み入力で O(n) になる。",
      starter: "def bubble_sort(nums):\n    a = nums[:]  # 元のリストを壊さないようコピー\n    n = len(a)\n    # ここに実装する\n    return a\n",
      tests: [
        { args: [[5, 2, 9, 1, 7]], expected: [1, 2, 5, 7, 9] },
        { args: [[3, 3, 1, 1, 2]], expected: [1, 1, 2, 3, 3] },
        { args: [[]], expected: [] },
        { args: [[1]], expected: [1] },
        { args: [[9, 8, 7, 6, 5, 4, 3, 2, 1]], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
        { args: [[-3, 0, -10, 5]], expected: [-10, -3, 0, 5] },
      ],
      hints: [
        "外側のループは n - 1 周。内側は range(n - 1 - i) で、確定済みの右端を触らないようにする。",
        "交換は Python なら a[j], a[j+1] = a[j+1], a[j] と 1 行で書ける。",
      ],
      solution:
        "def bubble_sort(nums):\n    a = nums[:]\n    n = len(a)\n    for i in range(n - 1):\n        swapped = False\n        for j in range(n - 1 - i):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n                swapped = True\n        if not swapped:\n            break\n    return a",
    },
    {
      id: "merge_sorted",
      title: "7. ソート済みリストのマージ",
      func: "merge_sorted",
      desc:
        "<b>どちらもソート済み</b>のリスト <code>a</code>, <code>b</code> を受け取り、全体がソート済みの 1 本のリストにして返す " +
        "<code>merge_sorted(a, b)</code> を書こう。<code>sorted(a + b)</code> は禁止 — それだと O((n+m) log(n+m)) だが、" +
        "<b>両方の先頭を見比べて小さい方を取る</b>だけなら O(n+m) で済む。" +
        "<br>これがマージソートの「統治」パート。可視化ページで見た書き戻しを、自分の手で。",
      starter: "def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    # ここに実装する\n    return result\n",
      tests: [
        { args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] },
        { args: [[], [1, 2]], expected: [1, 2] },
        { args: [[5], []], expected: [5] },
        { args: [[1, 1], [1]], expected: [1, 1, 1] },
        { args: [[1, 2, 3], [10, 20]], expected: [1, 2, 3, 10, 20] },
      ],
      hints: [
        "while i < len(a) and j < len(b): の間、小さい方を result に append してその添字を進める。",
        "どちらかを使い切ったら、もう片方の残りをまとめて足す（result.extend(a[i:]) など）。",
      ],
      solution:
        "def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    result.extend(a[i:])\n    result.extend(b[j:])\n    return result",
    },
    {
      id: "binary_search",
      title: "8. 二分探索",
      func: "binary_search",
      desc:
        "<b>ソート済み</b>リスト <code>a</code> から <code>x</code> を探し、見つかればその<b>インデックス</b>、" +
        "なければ <code>-1</code> を返す <code>binary_search(a, x)</code> を書こう。" +
        "<br>「二分探索」ページで自分の手を動かした、あの手順をそのままコードにする。<code>a.index(x)</code> や <code>in</code> は線形探索なので禁止（武士の誓い）。",
      starter: "def binary_search(a, x):\n    lo = 0\n    hi = len(a) - 1\n    while lo <= hi:\n        # ここに実装する\n        pass\n    return -1\n",
      tests: [
        { args: [[1, 3, 5, 7, 9, 11], 7], expected: 3 },
        { args: [[1, 3, 5, 7, 9, 11], 1], expected: 0 },
        { args: [[1, 3, 5, 7, 9, 11], 11], expected: 5 },
        { args: [[1, 3, 5, 7, 9, 11], 4], expected: -1 },
        { args: [[], 5], expected: -1 },
        { args: [[42], 42], expected: 0 },
      ],
      hints: [
        "mid = (lo + hi) // 2 で中央を求める（// は切り捨て除算）。",
        "a[mid] == x なら mid を返す。a[mid] < x なら lo = mid + 1、そうでなければ hi = mid - 1。",
        "while が終わってしまった（lo > hi になった）＝存在しないので -1。",
      ],
      solution:
        "def binary_search(a, x):\n    lo = 0\n    hi = len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == x:\n            return mid\n        elif a[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1",
    },
    {
      id: "hanoi_count",
      title: "9. ハノイの塔の手数（漸化式）",
      func: "hanoi_count",
      desc:
        "円盤 <code>n</code> 枚のハノイの塔を解く<b>最短手数</b>を返す <code>hanoi_count(n)</code> を書こう。" +
        "再帰ページで見たとおり、漸化式は <code>手数(n) = 2 × 手数(n−1) + 1</code>、<code>手数(0) = 0</code>。" +
        "<br>" +
        WARN_ICO +
        " テストには n=60 が含まれる。手順のリストを実際に作る（2⁶⁰ 個！）のは不可能なので、<b>手数だけ</b>をループか式で計算すること。" +
        "Python の整数は多倍長なので巨大な値も正確に扱える。",
      starter: "def hanoi_count(n):\n    # ここに実装する\n    return 0\n",
      tests: [
        { args: [0], expected: 0 },
        { args: [1], expected: 1 },
        { args: [3], expected: 7 },
        { args: [10], expected: 1023 },
        /* 2^60 - 1 は 2^53 を超えるので BigInt で保持する */
        { args: [60], expected: 1152921504606846975n },
      ],
      hints: [
        "count = 0 から始めて、n 回「count = count * 2 + 1」を繰り返す。",
        "漸化式を解くと閉じた式 2**n - 1 になる。どちらで書いても OK。",
      ],
      solution: "def hanoi_count(n):\n    count = 0\n    for _ in range(n):\n        count = count * 2 + 1\n    return count\n\n# 別解: return 2 ** n - 1",
    },
    {
      id: "fib",
      title: "10. フィボナッチ（計算量の罠）",
      func: "fib",
      desc:
        "フィボナッチ数列の第 <code>n</code> 項を返す <code>fib(n)</code> を書こう（<code>fib(0)=0, fib(1)=1, fib(n)=fib(n-1)+fib(n-2)</code>）。" +
        "<br>" +
        WARN_ICO +
        " <b>テストには fib(90) が含まれる。</b>定義どおりの素朴な再帰は O(2ⁿ) なので<b>絶対に終わらず、タブが固まる</b>。" +
        "ループ（または メモ化）で O(n) にしてから実行しよう。再帰ページの呼び出しツリーで見た、あの爆発の実践編だ。",
      starter: "def fib(n):\n    # 素朴な再帰 (return fib(n-1) + fib(n-2)) は罠！\n    # ループで前の 2 項を覚えながら進めよう\n    return 0\n",
      tests: [
        { args: [0], expected: 0 },
        { args: [1], expected: 1 },
        { args: [10], expected: 55 },
        { args: [30], expected: 832040 },
        /* fib(90) は 2^53 を超えるため BigInt で保持する（number だと精度が落ちる） */
        { args: [90], expected: 2880067194370816120n },
      ],
      hints: [
        "a, b = 0, 1 から始めて、n 回 「a, b = b, a + b」 を繰り返すと a が fib(n) になる。",
        "Python の整数は多倍長なので fib(90) のような巨大な数も正確に扱える。",
      ],
      solution: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a",
    },
    {
      id: "min_coins",
      title: "11. コイン両替（DP）",
      func: "min_coins",
      desc:
        "コインの種類リスト <code>coins</code> と金額 <code>amount</code> を受け取り、ちょうど支払うための<b>最少枚数</b>を返す " +
        "<code>min_coins(coins, amount)</code> を書こう。作れない場合は <code>-1</code>。" +
        "<br>例: <code>min_coins([1, 3, 4], 6)</code> → <code>2</code>（3+3）" +
        "<br>DP ページで手を動かして埋めた、あの表をそのままコードにする。貪欲に大きいコインから使う方法は" +
        " <code>[1,3,4]</code> で 6 円のとき 4+1+1 の 3 枚になってしまい、失敗することに注意。",
      starter: "def min_coins(coins, amount):\n    INF = float(\"inf\")\n    dp = [0] + [INF] * amount\n    # ここに実装する（dp[1] から順に埋める）\n    return -1\n",
      tests: [
        { args: [[1, 3, 4], 6], expected: 2 },
        { args: [[1, 3, 4], 11], expected: 3 },
        { args: [[2, 5], 3], expected: -1 },
        { args: [[1], 0], expected: 0 },
        { args: [[2, 5], 11], expected: 4 },
        { args: [[1, 5, 10, 50, 100, 500], 777], expected: 8 },
      ],
      hints: [
        "for i in range(1, amount + 1): の中で、各コイン c について c <= i なら dp[i - c] + 1 を候補にする。",
        "dp[i] = min(候補たち)。最後に dp[amount] が INF のままなら -1。",
      ],
      solution:
        "def min_coins(coins, amount):\n    INF = float(\"inf\")\n    dp = [0] + [INF] * amount\n    for i in range(1, amount + 1):\n        for c in coins:\n            if c <= i and dp[i - c] + 1 < dp[i]:\n                dp[i] = dp[i - c] + 1\n    return -1 if dp[amount] == INF else dp[amount]",
    },
    {
      id: "count_substring",
      title: "12. 部分文字列を数える",
      func: "count_substring",
      desc:
        "テキスト <code>text</code> の中にパターン <code>pat</code> が現れる回数を、<b>重なりも含めて</b>数える " +
        "<code>count_substring(text, pat)</code> を書こう。" +
        "<br>例: <code>count_substring(\"aaaa\", \"aa\")</code> → <code>3</code>（位置 0, 1, 2）" +
        "<br>注意: Python の <code>text.count(pat)</code> は重なりを数えない（この例だと 2）ので使えない。" +
        "文字列探索ページの総当たり法を素直に書けば OK。スライス <code>text[i:i+len(pat)]</code> が便利。",
      starter: "def count_substring(text, pat):\n    count = 0\n    # ここに実装する\n    return count\n",
      tests: [
        { args: ["aaaa", "aa"], expected: 3 },
        { args: ["hello world", "o"], expected: 2 },
        { args: ["abc", "x"], expected: 0 },
        { args: ["ababab", "aba"], expected: 2 },
        { args: ["abc", "abcd"], expected: 0 },
      ],
      hints: [
        "開始位置 i を 0 から len(text) - len(pat) まで動かす（range(len(text) - len(pat) + 1)）。",
        "text[i:i+len(pat)] == pat なら count += 1。1 文字ずつしかずらさないので重なりも数えられる。",
      ],
      solution:
        "def count_substring(text, pat):\n    count = 0\n    m = len(pat)\n    for i in range(len(text) - m + 1):\n        if text[i:i + m] == pat:\n            count += 1\n    return count",
    },
  ];

  /* two_sum の大規模テストはここで生成する（HTML に 20 万要素を書かないため） */
  function materializeArgs(args) {
    if (args.length === 1 && args[0] === "__BIG_TWO_SUM__") {
      var big = [];
      for (var i = 0; i < 200001; i++) big.push(1);
      big[99999] = 500000;
      big[100000] = 500001;
      return [big, 1000001];
    }
    return args;
  }

  function describeArgs(args) {
    if (args.length === 1 && args[0] === "__BIG_TWO_SUM__") {
      return "(len(nums)=200001 の大規模データ, target=1000001)";
    }
    var s = JSON.stringify(args);
    return "(" + s.slice(1, -1) + ")";
  }

  /* ---------------- Pyodide ---------------- */
  var pyodide = null;
  var pyDictClass = null; // 毎回 globals から引かずに使い回す（プロキシリーク防止）
  var stdoutBuffer = [];

  function setStatus(text, cls) {
    var el = $("pyodide-status");
    el.className = "msg " + cls;
    el.innerHTML = text;
  }

  function initPyodide() {
    if (typeof loadPyodide === "undefined") {
      setStatus("Pyodide を読み込めなかった。このページだけはインターネット接続が必要です。接続を確認して再読み込みしてください。", "err");
      return;
    }
    loadPyodide()
      .then(function (py) {
        pyodide = py;
        pyDictClass = pyodide.globals.get("dict");
        pyodide.setStdout({
          batched: function (s) {
            stdoutBuffer.push(s);
          },
        });
        pyodide.setStderr({
          batched: function (s) {
            stdoutBuffer.push(s);
          },
        });
        setStatus("Python " + pyodide.runPython("import sys; sys.version.split()[0]") + " の実行環境が準備できた。さあ、書こう。", "ok");
        $("run-tests-btn").disabled = false;
        $("pg-run-btn").disabled = false;
      })
      .catch(function (err) {
        setStatus("Pyodide の初期化に失敗: " + err, "err");
      });
  }

  /* コードを独立した名前空間で実行し、{ ns, value }（value は最後の式の値）を返す */
  function execInNamespace(code) {
    var ns = pyDictClass();
    var value;
    try {
      value = pyodide.runPython(code, { globals: ns });
    } catch (err) {
      ns.destroy();
      throw err;
    }
    return { ns: ns, value: value };
  }

  function destroyIfProxy(v) {
    if (v && typeof v.destroy === "function") v.destroy();
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a === "number" && typeof b === "number") return a === b;
    if (typeof a === "bigint" || typeof b === "bigint") {
      try {
        return BigInt(a) === BigInt(b);
      } catch (e) {
        return false; /* 小数など BigInt にできない値は不一致扱い */
      }
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    return false;
  }

  function reprJs(v) {
    if (typeof v === "bigint") return v.toString();
    if (Array.isArray(v)) {
      return "[" + v.map(reprJs).join(", ") + "]";
    }
    if (typeof v === "string") return '"' + v + '"';
    if (v === true) return "True";
    if (v === false) return "False";
    return String(v);
  }

  /* ---------------- テスト実行 ---------------- */
  var currentProblem = 0;

  function runTests() {
    var prob = PROBLEMS[currentProblem];
    var out = $("prob-output");
    var resultsBox = $("test-results");
    resultsBox.textContent = "";
    stdoutBuffer = [];

    var ns = null;
    try {
      var exec = execInNamespace($("prob-editor").value);
      ns = exec.ns;
      destroyIfProxy(exec.value); /* 定義だけのはずだが念のため */
    } catch (err) {
      out.textContent = "コードの実行でエラー:\n" + String(err.message || err);
      return;
    }

    var fn = ns.get(prob.func);
    if (typeof fn !== "function") {
      out.textContent =
        fn === undefined
          ? "関数 " + prob.func + " が定義されていない。関数名を変えずに書いてね。"
          : prob.func + " が関数ではなく値になっている。def " + prob.func + "(...): で定義しよう。";
      destroyIfProxy(fn);
      ns.destroy();
      return;
    }

    var passCount = 0;
    var results = [];
    for (var t = 0; t < prob.tests.length; t++) {
      var test = prob.tests[t];
      var args = materializeArgs(test.args);
      var line = { desc: prob.func + describeArgs(test.args), pass: false, detail: "" };
      var pyArgs = null;
      var raw = null;
      try {
        pyArgs = args.map(function (a) {
          return pyodide.toPy(a);
        });
        raw = fn.apply(null, pyArgs);
        var value = raw;
        if (raw && typeof raw.toJs === "function") {
          value = raw.toJs({ create_proxies: false });
        }
        if (deepEqual(value, test.expected)) {
          line.pass = true;
          passCount++;
          line.detail = "→ " + reprJs(value);
        } else {
          line.detail = "→ " + reprJs(value) + " （期待値: " + reprJs(test.expected) + "）";
        }
      } catch (err) {
        line.detail = "→ 実行時エラー: " + String(err.message || err).split("\n").slice(-2).join(" ");
      } finally {
        /* 例外時もプロキシを確実に解放する（特に two_sum の 20 万要素リスト） */
        destroyIfProxy(raw);
        if (pyArgs) pyArgs.forEach(destroyIfProxy);
      }
      results.push(line);
    }
    destroyIfProxy(fn);
    ns.destroy();

    var printed = stdoutBuffer.join("\n");
    out.textContent = (printed ? "--- print 出力 ---\n" + printed + "\n\n" : "") + "テスト結果: " + passCount + " / " + prob.tests.length + " 合格";

    results.forEach(function (r) {
      var div = document.createElement("div");
      div.className = "test-result " + (r.pass ? "pass" : "fail");
      var ico = document.createElement("span");
      ico.className = "ico " + (r.pass ? "ico-check" : "ico-cross");
      ico.style.verticalAlign = "-2px";
      ico.style.marginRight = "6px";
      div.appendChild(ico);
      div.appendChild(document.createTextNode(r.desc + " " + r.detail));
      resultsBox.appendChild(div);
    });

    if (passCount === prob.tests.length) {
      markSolved(prob.id);
      var congrats = document.createElement("div");
      congrats.className = "msg ok";
      congrats.textContent = "全テスト合格！ " + (allSolved() ? "全問クリア達成！お見事！" : "次の問題へ進もう。");
      resultsBox.appendChild(congrats);
      renderProblemTabs();
    }
  }

  /* ---------------- 進捗（localStorage） ---------------- */
  var STORAGE_KEY = "dojo-python-solved";

  function getSolved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function markSolved(id) {
    var solved = getSolved();
    if (solved.indexOf(id) === -1) {
      solved.push(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(solved));
      } catch (e) {
        /* プライベートブラウズ等では保存できないが致命的ではない */
      }
    }
    updateProgress();
  }

  function allSolved() {
    return getSolved().length >= PROBLEMS.length;
  }

  function updateProgress() {
    $("progress-label").textContent = getSolved().length + " / " + PROBLEMS.length;
  }

  /* ---------------- 問題の表示 ---------------- */
  var editedCode = {}; // 問題切り替え時にコードを保持
  var editorInitialized = false; // 初回ロード時に空エディタを保存しないためのガード

  function renderProblemTabs() {
    var box = $("problem-tabs");
    box.textContent = "";
    var solved = getSolved();
    PROBLEMS.forEach(function (p, i) {
      var btn = document.createElement("button");
      btn.className = "btn small" + (i === currentProblem ? " toggled" : "");
      btn.innerHTML = (solved.indexOf(p.id) !== -1 ? '<span class="ico ico-check" style="color:var(--accent-2)"></span>' : "") + (i + 1);
      btn.title = p.title;
      btn.addEventListener("click", function () {
        selectProblem(i);
      });
      box.appendChild(btn);
    });
  }

  function selectProblem(i) {
    if (editorInitialized) {
      editedCode[PROBLEMS[currentProblem].id] = $("prob-editor").value;
    }
    editorInitialized = true;
    currentProblem = i;
    var prob = PROBLEMS[i];
    $("prob-title").textContent = prob.title;
    $("editor-filename").textContent = prob.func + ".py";
    $("prob-desc").innerHTML = prob.desc;
    $("prob-editor").value = editedCode[prob.id] !== undefined ? editedCode[prob.id] : prob.starter;
    $("prob-output").textContent = "（まだ実行していない）";
    $("test-results").textContent = "";

    var hintsBox = $("prob-hints");
    hintsBox.textContent = "";
    prob.hints.forEach(function (h, hi) {
      var d = document.createElement("details");
      d.className = "hint-box";
      var s = document.createElement("summary");
      s.innerHTML = '<span class="ico ico-bulb"></span> ヒント ' + (hi + 1);
      d.appendChild(s);
      var p = document.createElement("div");
      p.style.cssText = "font-size: 0.9rem; color: var(--text-dim);";
      p.textContent = h;
      d.appendChild(p);
      hintsBox.appendChild(d);
    });

    var solBox = $("prob-solution");
    solBox.textContent = "";
    var d = document.createElement("details");
    d.className = "hint-box";
    var s = document.createElement("summary");
    s.textContent = "模範解答（自力で 15 分粘ってから開くこと）";
    d.appendChild(s);
    var pre = document.createElement("div");
    pre.className = "code-block";
    pre.textContent = prob.solution;
    d.appendChild(pre);
    solBox.appendChild(d);

    renderProblemTabs();
    updateProgress();
  }

  /* ---------------- プレイグラウンド ---------------- */
  function runPlayground() {
    var out = $("pg-output");
    stdoutBuffer = [];
    try {
      var exec = execInNamespace($("pg-editor").value);
      exec.ns.destroy();
      var printed = stdoutBuffer.join("\n");
      /* 最後の式の値（あれば）も REPL のように表示する */
      var valueText = "";
      if (exec.value !== undefined) {
        if (exec.value && typeof exec.value.destroy === "function") {
          valueText = "→ " + exec.value.toString();
          exec.value.destroy();
        } else {
          valueText = "→ " + String(exec.value);
        }
      }
      var text = [printed, valueText].filter(Boolean).join("\n");
      out.textContent = text || "（出力なし — print() するか、最後の行に式を書くと表示される）";
    } catch (err) {
      var printed2 = stdoutBuffer.join("\n");
      out.textContent = (printed2 ? printed2 + "\n" : "") + "エラー:\n" + String(err.message || err);
    }
  }

  /* ---------------- エディタの Tab キー対応 ---------------- */
  function enableTabKey(textarea) {
    textarea.addEventListener("keydown", function (e) {
      /* Shift+Tab は素通しにして、キーボードだけでフォーカスを外せるようにする */
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        this.value = this.value.slice(0, start) + "    " + this.value.slice(end);
        this.selectionStart = this.selectionEnd = start + 4;
      }
    });
  }

  /* ---------------- イベント ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initPyodide();
    selectProblem(0);
    updateProgress();

    $("run-tests-btn").addEventListener("click", runTests);
    $("reset-code-btn").addEventListener("click", function () {
      var prob = PROBLEMS[currentProblem];
      $("prob-editor").value = prob.starter;
      editedCode[prob.id] = undefined;
    });
    $("pg-run-btn").addEventListener("click", runPlayground);

    enableTabKey($("prob-editor"));
    enableTabKey($("pg-editor"));

    document.querySelectorAll("#mode-tabs .tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("#mode-tabs .tab-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        var mode = btn.dataset.mode;
        $("problems-mode").style.display = mode === "problems" ? "" : "none";
        $("playground-mode").style.display = mode === "playground" ? "" : "none";
      });
    });
  });
})();
