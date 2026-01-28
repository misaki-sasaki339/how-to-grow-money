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

// バリデーション
function showError(el, message) {
    el.textContent = message;
    el.classList.add("is-visible");
}

function clearError(el) {
    el.textContent = "";
    el.classList.remove("is-visible");
}

let growthChart = null;

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

// ローディングの非表示
function hideLoading() {
    loading.classList.remove("is-visible");
}

// イベント登録
openBtn.addEventListener("click", openModal);
mask.addEventListener("click", closeModal);

//======================
// 入力欄の追加・削除機能
//======================
const MAX_STEPS = 6;

// 入力欄を追加した際に番号を+1
function updateConditionTitles(container) {
    const groups = container.querySelectorAll(".rate-period-group");
    const stepNumbers = ["①", "②", "③", "④", "⑤", "⑥"];

    groups.forEach((group, index) => {
        const title = group.querySelector(".condition-title");
        if (title) {
        const mark = stepNumbers[index];
        title.textContent = `追加の育てる期間${mark}`;
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

// モーダル内のバリデーション
closeBtn.addEventListener("click", () => {
    let hasModalError = false;

    const modalGroups = document.querySelectorAll("#modal .rate-period-group");

    modalGroups.forEach(group => {
        const rate = group.querySelector(".input-rate").value.trim();
        const years = group.querySelector(".input-years").value.trim();

        // 両方空欄はOK
        if (!rate && !years) {
            return;
        }
        // 片方のみ入力時はエラー
        if (!rate || !years) {
            hasModalError = true;
        }
    });
    const modalFormError = document.getElementById("modal-form-error");
    if (hasModalError) {
        showError(
        modalFormError,
        "未入力の項目があります。すべて入力してください。"
        );
    return;
    }
    closeModal();
})

//======================
// 複利計算ロジック
//======================
const calculateBtn = document.querySelector(".calcurate-btn");

const resultSection = document.querySelector('.result-section');
const resultTableToggle = document.querySelector(".result-table-toggle")

calculateBtn.addEventListener("click", () => {
    const seed = Number(seedInput.value.replace(/,/g, ""));

    const loading = document.getElementById("loading");
    const seedError = document.getElementById("seed-error");
    const baseRateError = document.getElementById("base-rate-error");
    const baseYearsError = document.getElementById("base-years-error");


    let hasError = false;

    loading.classList.add("is-visible");
    setTimeout(() => {
        // =====================================
        // 最初の育てる期間（モーダル外）
        // =====================================
        const baseGroup = document.querySelector(".input-section > .rate-period-section .rate-period-group");
        const baseRate = Number(baseGroup.querySelector(".input-rate").value);
        const baseYears = Number(baseGroup.querySelector(".input-years").value);

        // バリデーション
        if (!seed || seed <= 0) {
            hideLoading();
            showError(seedError, "1以上の数字を入力してください");
            hasError = true;
        } else {
            clearError(seedError);
        }

        if (!baseRate) {
            hideLoading();
            showError(baseRateError, "利回りを入力してください");
            hasError = true;
        } else {
            clearError(baseRateError);
        }

        if (!baseYears) {
            hideLoading();
            showError(baseYearsError, "期間を入力してください");
            hasError = true;
        } else {
            clearError(baseYearsError)
        }

        if (hasError) {
            loading.classList.remove("is-visible");
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

        resultSection.classList.add("is-visible");
        resultTableToggle.classList.add("is-visible");
        resultSection.scrollIntoView({ behavior: "smooth" });

        // =====================================
        // 資産の合計・増減をchart.jsで描画
        // =====================================
        const labels = yearlyResults.map(r => r.year);
        const seeds = yearlyResults.map(() => seed);

        // 去年までの累計増加分
        const pastGains = yearlyResults.map(r => {
            return r.total - seed - r.increase
        });

        // 今年の増加分
        const yealyGains = yearlyResults.map(r => r.increase);

        const data = {
            labels,
            datasets: [{
                label: "はじまりのたね",
                data: seeds,
                backgroundColor: "#D6C3A5",
                stack: "money",
            },
            {
                label: "これまでに育った分",
                data: pastGains,
                backgroundColor: "#BFD8C7",
                stack: "money",
            },
            {
                label: "今年育った分",
                data: yealyGains,
                backgroundColor: "#F7E7A5",
                stack: "money"
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: "育てた年数（年）",
                            color: "#6B4E3D",
                            font: {
                                size: 14,
                                weight: "bold",
                            },
                        },
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "資産額（円）",
                            color: "#6B4E3D",
                            font: {
                                size: 14,
                                weight: "bold",
                            },
                        },
                        grid: {
                            color: "#EAF4FB"
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function (contexts) {
                                return `${contexts[0].label}年目`;
                            },
                            label: function (context) {
                                const value = context.parsed.y;
                                const datasetIndex = context.datasetIndex;

                                if (datasetIndex === 2) {
                                    return `今年は ${value.toLocaleString()}円育ちました！ `;
                                }
                                return `${context.dataset.label}：${value.toLocaleString()}円`;
                            }
                        }
                    }
                }
            },
        };

        const ctx = document.getElementById("growthChart");

        if (growthChart) {
            growthChart.destroy();
        }

        growthChart = new Chart(ctx, config);

        // =====================================
        // 資産の合計・増減をテーブル表示
        // =====================================
        const tableBody = document.getElementById("result-table-body");
        tableBody.innerHTML = "";

        yearlyResults.forEach(result => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
            <td>${result.year}</td>
            <td>${result.total.toLocaleString()}</td>
            <td>${result.increase.toLocaleString()}</td>
            `;

            tableBody.appendChild(tr);
        });

        // ローディング非表示
        loading.classList.remove("is-visible");
    }, 600);
});

//======================
// 入力内容のリセット
//======================
const resetBtn = document.querySelector(".reset-btn");
resetBtn.addEventListener('click', () => {
    // 入力値のリセット
    document.querySelectorAll("input").forEach(input => input.value = "");

    //エラーの非表示
    document.querySelectorAll(".error-message").forEach(err => {
        err.textContent = "";
        err.classList.remove("is-visible");
    });

    // グラフの破棄
    if (growthChart) {
        growthChart.destroy();
        growthChart = null;
    }

    // テーブルの削除
    document.getElementById("result-table-body").innerHTML = "";

    // 結果非表示
    resultSection.classList.remove("is-visible");
    resultTableToggle.classList.remove("is-visible");

    // ローディングの削除
    loading.classList.remove("is-visible");

    //======================
    // 入力内容のリセット
    //======================
    // 入力内容のクリア
    document.querySelectorAll("#modal input").forEach(input => {
        input.value = "";
    });

    // エラー文のクリア
    document.querySelectorAll("#modal .error-message, #modal .form-error").forEach(err => {
        err.textContent = "",
        err.classList.remove("is-visible");
    });

    // 追加されたブロックを初期状態に戻す
    const modalSection = document.querySelector("#modal .rate-period-section");
    const modalGroups = modalSection.querySelectorAll(".rate-period-group");

    modalGroups.forEach((group, index) => {
        if (index !== 0) {
            group.remove();
        }
    });

    // タイトル番号と＋ボタン状態を初期状態に戻す
    updateConditionTitles(modalSection);
    toggleAddButtons(modalSection);
});