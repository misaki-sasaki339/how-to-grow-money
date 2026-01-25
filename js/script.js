const seedInput = document.querySelector(".input-seed");
    // はじめのたね金額入力時にカンマ
seedInput.addEventListener("input", (e) => {
    let value = e.target.value;

    // 数字とカンマ以外は除去
    value = value.replace(/[^\d]/g, "");

    // 数値に変換
    const number = Number(value);
    if (Number.isNaN(number)) {
        e.target.value = "";
        return;
    }

    e.target.value = number.toLocaleString();
});


//======================
// DOMの取得
//======================
// モーダル関連
const openBtn = document.querySelector("#open-modal");
const closeBtn = document.querySelector("#close-modal");
const modal = document.querySelector("#modal");
const mask = document.querySelector("#mask");

// 操作対象をモーダル内に限定
const modalContent = modal.querySelector(".modal-content");
const ratePeriodSection = modalContent.querySelector(".rate-period-section");

//======================
// モーダルの制御
//======================
const showKeyframes = {
    opacity: [0, 1],
    visibility: "visible",
};
const hideKeyframes = {
    opacity: [1, 0],
    visibility: "hidden",
};
const animationOptions = {
    duration: 800,
    easing: "ease",
    fill: "forwards",
};

// モーダルウィンドウを開く
function openModal() {
    modal.animate(showKeyframes, animationOptions);
    mask.animate(showKeyframes, animationOptions);
}

// モーダルウィンドウを閉じる
function closeModal() {
    modal.animate(hideKeyframes, animationOptions);
    mask.animate(hideKeyframes, animationOptions);
}

// イベント登録
openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);
mask.addEventListener("click", closeModal);

//======================
// 入力欄の追加・削除機能
//======================
const MAX_STEPS = 6;

// 入力欄を追加した際に番号を+1
function updateConditionTitles(container) {
    const groups = container.querySelectorAll(".rate-period-group");
    const stepNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

    groups.forEach((group, index) => {
        const title = group.querySelector(".condition-title");
        if (title) {
        const mark = stepNumbers[index];
        title.textContent = `育てるステップ${mark}`;
        }
    });
}

// 追加上限に達したら＋ボタンを無効化
function toggleAddButtons(container) {
    const groups = container.querySelectorAll(".rate-period-group");
    const isMax = groups.length >= MAX_STEPS;

    container.querySelectorAll(".add-btn").forEach((btn) => {
        btn.disabled = isMax;
    });
}

function setupRatePeriodControls(container) {
    container.addEventListener("click", (e) => {
        // ＋ボタンで入力欄追加
        if (e.target.classList.contains("add-btn")) {
        const currentGroup = e.target.closest(".rate-period-group");
        const clone = currentGroup.cloneNode(true);

        // クローンの中身を空にする
        clone.querySelectorAll("input").forEach((input) => (input.value = ""));

        container.insertBefore(clone, currentGroup.nextSibling);
        updateConditionTitles(container);
        toggleAddButtons(container);
    }

    // ×ボタンを押すと入力欄削除
    if (e.target.classList.contains("remove-btn")) {
        const group = e.target.closest(".rate-period-group");
        const groups = container.querySelectorAll(".rate-period-group");

        // 最初の1行目だけは削除できない
        if (groups.length <= 1) return;

        group.remove();
        updateConditionTitles(container);
        toggleAddButtons(container);
        }
    });
}

// モーダル内のrate-period-sectionにだけ適用
setupRatePeriodControls(ratePeriodSection);

//======================
// 複利計算ロジック
//======================
const calculateBtn = document.querySelector(".calcurate-btn");

const resultSection = document.querySelector('.result-section');

calculateBtn.addEventListener("click", () => {
    const seed = Number(seedInput.value.replace(/,/g, ""));
    
    // =====================================
    // 最初の育てる期間（モーダル外）
    // =====================================
    const baseGroup = document.querySelector(".input-section > .rate-period-section .rate-period-group");
    const baseRate = Number(baseGroup.querySelector(".input-rate").value);
    const baseYears = Number(baseGroup.querySelector(".input-years").value);

    // バリデーション
    if (!seed || seed <= 0) {
        alert("はじめのたねを入力してください");
        return;
    }

    if (!baseRate || !baseYears) {
        alert("最初の育てる期間を入力してください");
        return;
    }

    // =====================================
    // 追加の育てる期間（モーダル内）
    // =====================================
    // 配列の最初に最初の育てる期間を入れる
    const conditions = [];
    conditions.push({
        rate: baseRate/100,
        years: baseYears
    });

    // モーダル内の期間を入れる
    const modalGroups = document.querySelectorAll('#modal .rate-period-group');

    modalGroups.forEach(group => {
        const rate = Number(group.querySelector('.input-rate')?.value);
        const years = Number(group.querySelector('.input-years')?.value);

        if (!rate || !years) return;

        conditions.push({
            rate: rate/100,
            years
        });
    })

    // console.log(conditions);

    // =====================================
    // 複利計算ロジック
    // =====================================
    let currentAmount = seed;
    let yearCount = 0;
    const yearlyResults = [];
    
    conditions.forEach(condition => {
        for (let i = 0; i < condition.years; i++) {
            const before = currentAmount;
            currentAmount *= (1 + condition.rate);
            yearCount++;

            yearlyResults.push({
                year: yearCount,
                total: Math.round(currentAmount),
                increase: Math.round(currentAmount - before)
            });
        }
    });

    console.log(yearlyResults);

    resultSection.classList.add("is-visible");
    resultSection.scrollIntoView({ behavior: "smooth" });
});

