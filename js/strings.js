/* 文字列探索ページ: 総当たり / KMP の可視化 + 対決モード */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  var state = {
    text: "",
    pattern: "",
    algo: "naive",
    res: null,
    stepIdx: -1, /* -1 = まだ何も比較していない */
    timer: null,
  };

  function setMsg(text, cls) {
    var el = $("str-msg");
    el.className = "msg " + cls;
    el.textContent = text;
  }

  function stopAuto() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function rebuild() {
    stopAuto();
    state.text = $("str-text").value;
    state.pattern = $("str-pattern").value;
    state.algo = $("str-algo").value;
    state.stepIdx = -1;
    if (state.pattern.length === 0) {
      setMsg("パターンを入力してね。", "err");
      state.res = null;
      render();
      return;
    }
    if (state.pattern.length > state.text.length) {
      setMsg("パターンがテキストより長いと、見つかりようがない。", "err");
      state.res = null;
      render();
      return;
    }
    state.res =
      state.algo === "naive"
        ? Algo.naiveSearchSteps(state.text, state.pattern)
        : Algo.kmpSearchSteps(state.text, state.pattern);
    setMsg("「1比較進む」でスタート。上がテキスト、下が現在の位置に合わせたパターン。", "info");
    render();
  }

  /* stepIdx までを反映した描画 */
  function render() {
    var view = $("str-view");
    view.textContent = "";
    var text = state.text;
    var m = state.pattern.length;

    /* stepIdx 時点の状態を集計 */
    var shift = 0;
    var matchedInAlignment = {}; /* 現在の shift で一致済みの j */
    var mismatchJ = -1;
    var foundSet = {};
    var comparisons = 0;
    if (state.res) {
      for (var k = 0; k <= state.stepIdx && k < state.res.steps.length; k++) {
        var st = state.res.steps[k];
        comparisons++;
        if (st.shift !== shift) {
          matchedInAlignment = {};
          mismatchJ = -1;
        }
        shift = st.shift;
        if (st.match) {
          matchedInAlignment[st.j] = true;
          mismatchJ = -1;
          if (st.j === m - 1) foundSet[st.shift] = true;
        } else {
          mismatchJ = st.j;
        }
      }
    }
    var started = state.stepIdx >= 0 && state.res;

    /* インデックス行 */
    var headRow = document.createElement("div");
    headRow.className = "str-row";
    for (var hi = 0; hi < text.length; hi++) {
      var hc = document.createElement("div");
      hc.className = "str-cell head";
      hc.textContent = hi;
      headRow.appendChild(hc);
    }
    view.appendChild(headRow);

    /* テキスト行（発見済みの出現をマーク） */
    var textRow = document.createElement("div");
    textRow.className = "str-row";
    for (var ti = 0; ti < text.length; ti++) {
      var tc = document.createElement("div");
      tc.className = "str-cell";
      tc.textContent = text.charAt(ti);
      var inFound = Object.keys(foundSet).some(function (s) {
        var sv = parseInt(s, 10);
        return ti >= sv && ti < sv + m;
      });
      if (inFound) tc.classList.add("found");
      if (started) {
        var j = ti - shift;
        if (j >= 0 && j < m) {
          if (matchedInAlignment[j]) tc.classList.add("match");
          else if (j === mismatchJ) tc.classList.add("mismatch");
        }
      }
      textRow.appendChild(tc);
    }
    view.appendChild(textRow);

    /* パターン行（shift ぶん透明セルでオフセット） */
    if (state.res) {
      var patRow = document.createElement("div");
      patRow.className = "str-row";
      for (var g = 0; g < shift; g++) {
        var ghost = document.createElement("div");
        ghost.className = "str-cell ghost";
        patRow.appendChild(ghost);
      }
      for (var pj = 0; pj < m; pj++) {
        var pc = document.createElement("div");
        pc.className = "str-cell";
        pc.textContent = state.pattern.charAt(pj);
        if (started) {
          if (matchedInAlignment[pj]) pc.classList.add("match");
          else if (pj === mismatchJ) pc.classList.add("mismatch");
          else if (pj === nextJ()) pc.classList.add("cursor");
        }
        patRow.appendChild(pc);
      }
      view.appendChild(patRow);

      /* KMP は失敗関数を添える */
      if (state.algo === "kmp") {
        var fRow = document.createElement("div");
        fRow.className = "str-row";
        for (var g2 = 0; g2 < shift; g2++) {
          var ghost2 = document.createElement("div");
          ghost2.className = "str-cell ghost";
          fRow.appendChild(ghost2);
        }
        for (var fj = 0; fj < m; fj++) {
          var fc = document.createElement("div");
          fc.className = "str-cell head";
          fc.style.height = "20px";
          fc.textContent = state.res.failure[fj];
          fc.title = "失敗関数 f[" + fj + "] = " + state.res.failure[fj];
          fRow.appendChild(fc);
        }
        view.appendChild(fRow);
      }
    }

    $("str-cmp").textContent = String(comparisons);
    $("str-found").textContent = String(Object.keys(foundSet).length);
  }

  /* 次に比較するパターン位置（カーソル表示用） */
  function nextJ() {
    if (!state.res || state.stepIdx + 1 >= state.res.steps.length) return -1;
    var next = state.res.steps[state.stepIdx + 1];
    var cur = state.stepIdx >= 0 ? state.res.steps[state.stepIdx] : null;
    if (cur && next.shift !== cur.shift) return -1; /* ずれる直前はカーソルを出さない */
    return next.j;
  }

  function describeStep() {
    var st = state.res.steps[state.stepIdx];
    var m = state.pattern.length;
    var tIdx = st.shift + st.j;
    var base =
      "テキスト[" + tIdx + "]=\"" + state.text.charAt(tIdx) + "\" と パターン[" + st.j + "]=\"" + state.pattern.charAt(st.j) + "\" を比較 → " + (st.match ? "一致" : "不一致");
    if (st.match && st.j === m - 1) {
      return base + "。パターン全体が一致！ 位置 " + st.shift + " で発見。";
    }
    if (!st.match) {
      if (state.algo === "naive") {
        return base + "。総当たりは 1 文字だけ右へずらして、また先頭から。";
      }
      if (st.j === 0) {
        return base + "。先頭で不一致なので 1 文字右へ。";
      }
      var f = state.res.failure[st.j - 1];
      return base + "。KMP は失敗関数 f[" + (st.j - 1) + "]=" + f + " を見て、一致済みの " + st.j + " 文字のうち " + f + " 文字を活かしてスライド（テキスト側は戻らない）。";
    }
    return base + "。次の文字へ。";
  }

  function step() {
    if (!state.res) return;
    if (state.stepIdx + 1 >= state.res.steps.length) {
      stopAuto();
      var found = state.res.found;
      setMsg(
        "終了。比較 " + state.res.comparisons + " 回で " + (found.length > 0 ? "位置 " + found.join(", ") + " に発見。" : "見つからなかった（無いことの確認にもこれだけかかる）。") +
          (state.algo === "naive" ? " 同じ入力を KMP でも試して比較回数を見比べよう。" : ""),
        found.length > 0 ? "ok" : "info"
      );
      return;
    }
    state.stepIdx++;
    render();
    setMsg(describeStep(), "info");
  }

  function auto() {
    if (!state.res) return;
    if (state.stepIdx + 1 >= state.res.steps.length) state.stepIdx = -1;
    stopAuto();
    state.timer = setInterval(function () {
      if (!state.res || state.stepIdx + 1 >= state.res.steps.length) {
        step(); /* 終了メッセージを出して止まる */
        stopAuto();
        return;
      }
      step();
    }, 380);
  }

  /* ================= 対決モード ================= */
  function battle() {
    var text = new Array(61).join("a"); /* "a" x 60 */
    var pattern = "aaaab";
    var naive = Algo.naiveSearchSteps(text, pattern);
    var kmp = Algo.kmpSearchSteps(text, pattern);
    var maxCmp = Math.max(naive.comparisons, kmp.comparisons);

    var t0 = null;
    var DURATION = 1400;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / DURATION);
      var nc = Math.round(naive.comparisons * p);
      var kc = Math.round(kmp.comparisons * p);
      $("battle-cmp-naive").textContent = nc + " 回";
      $("battle-cmp-kmp").textContent = kc + " 回";
      $("battle-bar-naive").style.width = (nc / maxCmp) * 100 + "%";
      $("battle-bar-kmp").style.width = (kc / maxCmp) * 100 + "%";
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        var el = $("battle-msg");
        el.className = "msg ok";
        el.textContent =
          "総当たり " + naive.comparisons + " 回 vs KMP " + kmp.comparisons + " 回（約 " + Math.round(naive.comparisons / kmp.comparisons) + " 分の 1）。テキストが 100 万文字ならこの差は桁違いに効く。";
      }
    }
    requestAnimationFrame(frame);
  }

  /* ================= イベント ================= */
  document.addEventListener("DOMContentLoaded", function () {
    $("str-step-btn").addEventListener("click", function () {
      stopAuto();
      step();
    });
    $("str-auto-btn").addEventListener("click", auto);
    $("str-reset-btn").addEventListener("click", rebuild);
    $("str-text").addEventListener("change", rebuild);
    $("str-pattern").addEventListener("change", rebuild);
    $("str-algo").addEventListener("change", rebuild);
    $("battle-btn").addEventListener("click", battle);

    Dojo.mountQuiz(
      { start: "sq-quiz-start", area: "sq-quiz-area", score: "sq-quiz-score" },
      [
        {
          q: "テキストの長さ n・パターンの長さ m のとき、総当たり法の最悪の比較回数はおよそ？",
          options: ["n + m", "n × m", "n²", "log n"],
          answer: 1,
          explain: "「aaa…ab」を「aaa…a」から探すような意地悪入力では、ほぼ全部の位置で m 文字近く照合してから裏切られる。だから n × m。",
        },
        {
          q: "KMP 法の「失敗関数」が教えてくれるものは？",
          options: ["パターンが出現する位置", "不一致になったとき、パターンの何文字目から再開できるか", "テキストのうち読み飛ばせる範囲", "比較が失敗した回数"],
          answer: 1,
          explain: "パターンの中の「繰り返し模様」を事前に調べておくことで、途中まで一致した情報を捨てずに再開位置へワープできる。",
        },
        {
          q: "\"AAAA\" から \"AA\" を探すと、重なりも数えて何箇所で見つかる？",
          options: ["1 箇所", "2 箇所", "3 箇所", "4 箇所"],
          answer: 2,
          explain: "位置 0・1・2 の 3 箇所。1 文字ずつずらして数えるのがポイント（Python の str.count は重なりを数えないので 2 になる —— Python 実践の問題 12 で罠になる）。",
        },
        {
          q: "KMP 法が「テキスト側を一度も後戻りしない」おかげで可能になることは？",
          options: ["ソートなしで二分探索できる", "流れてくるデータ（ストリーム）をそのまま検索できる", "パターンなしでも検索できる", "検索結果を自動で並べ替えられる"],
          answer: 1,
          explain: "読んだ文字を二度と読み直さないので、全文をメモリに置けない通信データやログの垂れ流しに対しても、届いたそばから検索できる。",
        },
      ]
    );

    rebuild();
  });
})();
