/* データ構造ページ: スタック・キュー・予想クイズ・ハッシュテーブル */
(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };

  function setMsg(id, text, cls) {
    var el = $(id);
    if (!text) {
      el.textContent = "";
      el.className = "";
      return;
    }
    el.className = "msg " + cls;
    el.textContent = text;
  }

  /* ================= スタック ================= */
  var stack = [];

  function renderStack() {
    var view = $("stack-view");
    view.textContent = "";
    if (stack.length === 0) {
      var empty = document.createElement("span");
      empty.className = "ds-empty";
      empty.textContent = "空（push してみよう）";
      view.appendChild(empty);
    } else {
      stack.forEach(function (v, i) {
        var item = document.createElement("div");
        item.className = "ds-item" + (i === stack.length - 1 ? " top" : "");
        item.textContent = v;
        view.appendChild(item);
      });
    }
    $("stack-size").textContent = String(stack.length);
  }

  function stackValue() {
    var raw = $("stack-input").value;
    if (raw === "") return Dojo.randInt(10, 99);
    return parseInt(raw, 10);
  }

  /* ================= キュー ================= */
  var queue = [];

  function renderQueue() {
    var view = $("queue-view");
    view.textContent = "";
    if (queue.length === 0) {
      var empty = document.createElement("span");
      empty.className = "ds-empty";
      empty.textContent = "空（enqueue してみよう）";
      view.appendChild(empty);
    } else {
      queue.forEach(function (v, i) {
        var item = document.createElement("div");
        item.className = "ds-item" + (i === 0 ? " top" : "");
        item.textContent = v;
        view.appendChild(item);
      });
    }
    $("queue-size").textContent = String(queue.length);
  }

  function queueValue() {
    var raw = $("queue-input").value;
    if (raw === "") return Dojo.randInt(10, 99);
    return parseInt(raw, 10);
  }

  /* ================= 予想クイズ ================= */
  var quiz = { score: 0, total: 0, answer: null, answered: true };

  function newQuiz() {
    var isStack = Dojo.randInt(0, 1) === 0;
    var sim = [];
    var lines = [];
    var opCount = Dojo.randInt(4, 6);
    var used = [];
    for (var i = 0; i < opCount; i++) {
      /* 空にならないよう、序盤は必ず入れる。まれに途中で 1 個取り出す */
      var doRemove = sim.length >= 2 && Dojo.randInt(1, 3) === 1;
      if (doRemove) {
        var removed = isStack ? sim.pop() : sim.shift();
        lines.push((isStack ? "pop()" : "dequeue()") + "   # → " + removed + " が出た");
      } else {
        var v;
        do {
          v = Dojo.randInt(10, 99);
        } while (used.indexOf(v) !== -1);
        used.push(v);
        sim.push(v);
        lines.push((isStack ? "push(" : "enqueue(") + v + ")");
      }
    }
    if (sim.length === 0) {
      newQuiz();
      return;
    }
    quiz.answer = isStack ? sim[sim.length - 1] : sim[0];
    quiz.answered = false;

    var area = $("ds-quiz-area");
    area.textContent = "";

    var head = document.createElement("p");
    head.style.cssText = "color: var(--text-dim); font-size: 0.9rem; margin: 14px 0 4px;";
    head.textContent = (isStack ? "空のスタック" : "空のキュー") + "に次の操作を順に行った。いま " + (isStack ? "pop()" : "dequeue()") + " すると出てくる値は？";
    area.appendChild(head);

    var code = document.createElement("div");
    code.className = "code-block";
    code.textContent = lines.join("\n");
    area.appendChild(code);

    /* 選択肢: 正解 + 中身からダミー（足りなければ乱数） */
    var options = [quiz.answer];
    var pool = sim.slice();
    Dojo.shuffle(pool).forEach(function (v) {
      if (options.length < 4 && options.indexOf(v) === -1) options.push(v);
    });
    while (options.length < 4) {
      var dv = Dojo.randInt(10, 99);
      if (options.indexOf(dv) === -1) options.push(dv);
    }
    var feedback = document.createElement("div");
    Dojo.shuffle(options).forEach(function (opt) {
      var btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = String(opt);
      btn.addEventListener("click", function () {
        if (quiz.answered) return;
        quiz.answered = true;
        quiz.total++;
        var correct = opt === quiz.answer;
        if (correct) quiz.score++;
        area.querySelectorAll(".quiz-option").forEach(function (b) {
          b.disabled = true;
          if (b.textContent === String(quiz.answer)) b.classList.add("correct");
        });
        if (!correct) btn.classList.add("wrong");
        feedback.className = "msg " + (correct ? "ok" : "err");
        feedback.textContent = correct
          ? "正解。" + (isStack ? "スタックは最後に push した " + quiz.answer + " が先に出る（LIFO）。" : "キューは最初に enqueue した " + quiz.answer + " から順に出る（FIFO）。")
          : "不正解。正解は " + quiz.answer + "。" + (isStack ? "スタックは「最後に入れたもの」が先に出る。" : "キューは「最初に入れたもの」が先に出る。");
        $("ds-quiz-score").textContent = quiz.score + " / " + quiz.total;
      });
      area.appendChild(btn);
    });
    area.appendChild(feedback);
  }

  /* ================= ハッシュテーブル ================= */
  var BUCKETS = 8;
  var buckets = [];
  var insertedOrder = []; /* 線形探索との比較用 */

  function initBuckets() {
    buckets = [];
    for (var i = 0; i < BUCKETS; i++) buckets.push([]);
    insertedOrder = [];
  }

  function renderHash(highlight) {
    var wrap = $("hash-buckets");
    wrap.textContent = "";
    buckets.forEach(function (chain, i) {
      var b = document.createElement("div");
      b.className = "hash-bucket" + (highlight && highlight.bucket === i ? " target" : "");
      var idx = document.createElement("div");
      idx.className = "b-idx";
      idx.textContent = String(i);
      b.appendChild(idx);
      chain.forEach(function (key) {
        var chip = document.createElement("div");
        chip.className = "hash-chip";
        if (highlight && highlight.bucket === i) {
          if (highlight.hit === key) chip.classList.add("hit");
          else if (highlight.compared && highlight.compared.indexOf(key) !== -1) chip.classList.add("miss");
        }
        chip.textContent = key;
        chip.title = key;
        b.appendChild(chip);
      });
      wrap.appendChild(b);
    });
    $("hash-count").textContent = String(insertedOrder.length);
  }

  function showCalc(key) {
    var h = Algo.hashString(key, BUCKETS);
    var el = $("hash-calc");
    el.style.display = "";
    var parts = [];
    for (var i = 0; i < key.length; i++) parts.push('"' + key.charAt(i) + '"=' + h.codes[i]);
    el.textContent = "hash(\"" + key + "\") = (" + parts.join(" + ") + ") % " + BUCKETS + " = " + h.sum + " % " + BUCKETS + " = " + h.index;
    return h.index;
  }

  function addKey() {
    var key = $("hash-input").value.trim();
    if (!key) {
      setMsg("hash-msg", "キーを入力してね（例: apple）。", "err");
      return;
    }
    var idx = showCalc(key);
    if (buckets[idx].indexOf(key) !== -1) {
      setMsg("hash-msg", "「" + key + "」はすでにバケツ " + idx + " にある。", "info");
      renderHash({ bucket: idx, hit: key });
      return;
    }
    buckets[idx].push(key);
    insertedOrder.push(key);
    var collision = buckets[idx].length > 1;
    setMsg(
      "hash-msg",
      collision
        ? "バケツ " + idx + " に追加。先客がいたので同じバケツに鎖のようにつながった（衝突・チェイン法）。"
        : "バケツ " + idx + " に追加した。",
      collision ? "info" : "ok"
    );
    renderHash({ bucket: idx });
    $("hash-input").value = "";
    $("hash-input").focus();
  }

  function findKey() {
    var key = $("hash-input").value.trim();
    if (!key) {
      setMsg("hash-msg", "検索するキーを入力してね。", "err");
      return;
    }
    var idx = showCalc(key);
    var chain = buckets[idx];
    var compared = [];
    var found = false;
    var cmp = 0;
    for (var i = 0; i < chain.length; i++) {
      cmp++;
      if (chain[i] === key) {
        found = true;
        break;
      }
      compared.push(chain[i]);
    }
    if (chain.length === 0) cmp = 0;

    /* 線形探索なら何回比較したか */
    var linear = insertedOrder.indexOf(key);
    var linearCmp = linear === -1 ? insertedOrder.length : linear + 1;

    $("hash-cmp").textContent = cmp + " 回";
    $("hash-linear-cmp").textContent = linearCmp + " 回";
    setMsg(
      "hash-msg",
      found
        ? "発見。バケツ " + idx + " だけを見ればよいので比較は " + cmp + " 回。リストを前から探すと最悪 " + linearCmp + " 回かかる。"
        : "「" + key + "」は無い。無いことの確認もバケツ " + idx + " の中身（" + cmp + " 回の比較）だけで済む。",
      found ? "ok" : "info"
    );
    renderHash({ bucket: idx, hit: found ? key : null, compared: compared });
  }

  function addSamples() {
    var samples = ["apple", "grape", "peach", "melon", "lemon", "berry", "mango", "kiwi"];
    samples.forEach(function (key) {
      var idx = Algo.hashString(key, BUCKETS).index;
      if (buckets[idx].indexOf(key) === -1) {
        buckets[idx].push(key);
        insertedOrder.push(key);
      }
    });
    $("hash-calc").style.display = "none";
    setMsg("hash-msg", "果物 8 種を投入した。バケツへの散らばり方と、同じバケツに複数入った所（衝突）を見てみよう。", "info");
    renderHash(null);
  }

  /* ================= イベント ================= */
  document.addEventListener("DOMContentLoaded", function () {
    $("stack-push-btn").addEventListener("click", function () {
      var v = stackValue();
      if (isNaN(v)) return;
      if (stack.length >= 10) {
        setMsg("stack-msg", "見やすさのため 10 個まで。pop してから積もう。", "err");
        return;
      }
      stack.push(v);
      setMsg("stack-msg", "push(" + v + ") — 一番上に積まれた。", "ok");
      $("stack-input").value = "";
      renderStack();
    });
    $("stack-pop-btn").addEventListener("click", function () {
      if (stack.length === 0) {
        setMsg("stack-msg", "空のスタックからは pop できない（スタックアンダーフロー）。", "err");
        return;
      }
      var v = stack.pop();
      setMsg("stack-msg", "pop() → " + v + "。最後に積んだものが最初に出る（LIFO）。", "info");
      renderStack();
    });
    $("stack-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") $("stack-push-btn").click();
    });

    $("queue-enq-btn").addEventListener("click", function () {
      var v = queueValue();
      if (isNaN(v)) return;
      if (queue.length >= 8) {
        setMsg("queue-msg", "見やすさのため 8 個まで。dequeue してから並べよう。", "err");
        return;
      }
      queue.push(v);
      setMsg("queue-msg", "enqueue(" + v + ") — 行列の最後尾に並んだ。", "ok");
      $("queue-input").value = "";
      renderQueue();
    });
    $("queue-deq-btn").addEventListener("click", function () {
      if (queue.length === 0) {
        setMsg("queue-msg", "空のキューからは dequeue できない。", "err");
        return;
      }
      var v = queue.shift();
      setMsg("queue-msg", "dequeue() → " + v + "。最初に並んだものから出ていく（FIFO）。", "info");
      renderQueue();
    });
    $("queue-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") $("queue-enq-btn").click();
    });

    $("ds-quiz-btn").addEventListener("click", newQuiz);

    $("hash-add-btn").addEventListener("click", addKey);
    $("hash-find-btn").addEventListener("click", findKey);
    $("hash-sample-btn").addEventListener("click", addSamples);
    $("hash-clear-btn").addEventListener("click", function () {
      initBuckets();
      $("hash-calc").style.display = "none";
      $("hash-cmp").textContent = "-";
      $("hash-linear-cmp").textContent = "-";
      setMsg("hash-msg", "", "");
      renderHash(null);
    });
    $("hash-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") addKey();
    });

    initBuckets();
    renderStack();
    renderQueue();
    renderHash(null);
  });
})();
