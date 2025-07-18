// API 配置
const SAMPLE_API_BASE_URL = 'http://localhost:3000/v1';

// 页面元素
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const samplesContainerEl = document.getElementById('samples-container');
const samplesGridEl = document.getElementById('samples-grid');
const samplesListEl = document.getElementById('samples-list');

let currentEditId = null;

// 分页相关
const PAGE_SIZE = 10;
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';

// 获取样例问题列表（支持分页和模糊查询）
async function fetchSamples(page = 1, example = '') {
    try {
        showLoading();
        const body = {
            page: page,
            page_size: PAGE_SIZE,
        };
        if (example && example.trim()) {
            body.example = example.trim();
        }
        const response = await fetch(`${SAMPLE_API_BASE_URL}/sample/list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 200) {
            // 适配后端返回 { data: [...], page_info: { total, ... } }
            const list = Array.isArray(data.data) ? data.data : [];
            const total = data.page_info?.total || list.length;
            window.samplesData = list;
            currentPage = page;
            totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            displaySamples(list, total);
        } else {
            throw new Error(data.msg || '获取样例问题失败');
        }
    } catch (error) {
        console.error('获取样例问题失败:', error);
        showError(error.message);
    }
}

// 显示样例问题列表（表格）
function displaySamples(samples, total = 0) {
    hideLoading();
    hideError();
    samplesListEl.innerHTML = samples.map(sample => `
        <tr>
            <td class="align-top">${sample.example}</td>
            <td class="align-top">
                <button class="btn btn-info btn-xs mr-2" onclick="editSample(${sample.id})">修改</button>
                <button class="btn btn-error btn-xs" onclick="deleteSample(${sample.id})">删除</button>
            </td>
        </tr>
    `).join('');
    // 分页信息
    document.getElementById('page-info').textContent = `第 ${currentPage} / ${totalPages} 页（共${total}条）`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    samplesContainerEl.classList.remove('hidden');
}

// 显示加载状态
function showLoading() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    samplesContainerEl.classList.add('hidden');
}

// 隐藏加载状态
function hideLoading() {
    loadingEl.classList.add('hidden');
}

// 显示错误状态
function showError(message) {
    hideLoading();
    errorMessageEl.textContent = message;
    errorEl.classList.remove('hidden');
    samplesContainerEl.classList.add('hidden');
}

// 隐藏错误状态
function hideError() {
    errorEl.classList.add('hidden');
}

// 打开编辑模态框并填充数据
async function editSample(id) {
    currentEditId = id;
    // 先清空表单
    document.getElementById('edit-form').reset();
    // 拉取完整数据
    try {
        const response = await fetch(`${SAMPLE_API_BASE_URL}/sample/show/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 200 && data.data) {
            const sample = data.data;
            document.getElementById('edit-example').value = sample.example || '';
            document.getElementById('edit-intent').value = sample.intent || 'content';
            document.getElementById('edit-quantity').value = sample.quantity || '';
            document.getElementById('edit-op').value = sample.op || '';
            document.getElementById('edit-sort').value = sample.sort || '';
            // 解析 publish 字段为 key:value 形式
            const publish = sample.publish || '';
            if (publish.indexOf(':') > 0) {
                document.getElementById('edit-publish-key').value = publish.substring(0, publish.indexOf(':')).trim();
                document.getElementById('edit-publish-value').value = publish.substring(publish.indexOf(':') + 1).trim();
            } else {
                document.getElementById('edit-publish-key').value = '';
                document.getElementById('edit-publish-value').value = '';
            }
            handleIntentFields(sample.intent || 'content');
        } else {
            // 清空
            document.getElementById('edit-intent').value = 'content';
            document.getElementById('edit-quantity').value = '';
            document.getElementById('edit-op').value = '';
            document.getElementById('edit-sort').value = '';
            document.getElementById('edit-publish-key').value = '';
            document.getElementById('edit-publish-value').value = '';
            handleIntentFields('content');
        }
    } catch (error) {
        alert('获取样例详情失败: ' + error.message);
    }
    document.getElementById('edit-modal').showModal();
}

// 根据意图禁用/清空无关字段
document.getElementById('edit-intent').addEventListener('change', function (e) {
    handleIntentFields(e.target.value);
});
function handleIntentFields(intent) {
    const disable = (intent === 'greet' || intent === 'else');
    [
        'edit-quantity', 'edit-op', 'edit-sort', 'edit-publish-key', 'edit-publish-value'
    ].forEach(id => {
        const el = document.getElementById(id);
        el.disabled = disable;
        if (disable) el.value = '';
    });
}

// 关闭编辑模态框
function closeEditModal() {
    document.getElementById('edit-modal').close();
}

// 新增样例相关
function openCreateModal() {
    // 清空表单
    document.getElementById('create-form').reset();
    document.getElementById('create-publish-key').value = '';
    document.getElementById('create-publish-value').value = '';
    document.getElementById('create-modal').showModal();
}
function closeCreateModal() {
    document.getElementById('create-modal').close();
}
async function saveCreateSample() {
    const form = document.getElementById('create-form');
    const formData = new FormData(form);
    const sampleData = Object.fromEntries(formData.entries());
    // 组合 publish 字段为 key:value 格式
    const publishKey = document.getElementById('create-publish-key').value.trim();
    const publishValue = document.getElementById('create-publish-value').value.trim();
    sampleData.publish = (publishKey && publishValue) ? `${publishKey}：${publishValue}` : '';
    sampleData.quantity = sampleData.quantity ? parseInt(sampleData.quantity) : 0;
    // 只保留接口需要的字段
    const payload = {
        example: sampleData.example,
        publish: sampleData.publish,
        sort: sampleData.sort,
        quantity: sampleData.quantity,
        op: sampleData.op,
        intent: sampleData.intent
    };
    try {
        const response = await fetch(`${SAMPLE_API_BASE_URL}/sample/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 200) {
            alert('新增成功！');
            closeCreateModal();
            fetchSamples();
        } else {
            throw new Error(data.msg || '新增失败');
        }
    } catch (error) {
        alert('新增失败: ' + error.message);
    }
}

// 保存编辑
async function saveEditSample() {
    const form = document.getElementById('edit-form');
    const formData = new FormData(form);
    const sampleData = Object.fromEntries(formData.entries());
    // 校验：start_date/end_date必须成对填写或都为空
    if ((sampleData.start_date && !sampleData.end_date) || (!sampleData.start_date && sampleData.end_date)) {
        alert('开始日期和结束日期必须同时填写或都为空');
        return;
    }
    // 校验：quantity/op必须成对填写或都为空
    if ((sampleData.quantity && !sampleData.op) || (!sampleData.quantity && sampleData.op)) {
        alert('数量和操作符必须同时填写或都为空');
        return;
    }
    // intent为greet/else时，其他参数应为空
    if ((sampleData.intent === 'greet' || sampleData.intent === 'else')) {
        sampleData.quantity = '';
        sampleData.op = '';
        sampleData.sort = '';
        sampleData.publish = '';
    }
    // 组合 publish 字段为 key:value 格式
    const publishKey = document.getElementById('edit-publish-key').value.trim();
    const publishValue = document.getElementById('edit-publish-value').value.trim();
    sampleData.publish = (publishKey && publishValue) ? `${publishKey}:${publishValue}` : '';
    sampleData.quantity = sampleData.quantity ? parseInt(sampleData.quantity) : 0;
    // 发起更新请求
    try {
        const response = await fetch(`${SAMPLE_API_BASE_URL}/sample/update/${currentEditId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sampleData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 200) {
            alert('修改成功！');
            closeEditModal();
            fetchSamples();
        } else {
            throw new Error(data.msg || '修改失败');
        }
    } catch (error) {
        alert('修改失败: ' + error.message);
    }
}

// 删除样例
async function deleteSample(id) {
    if (!confirm('确定要删除该样例问题吗？此操作不可撤销。')) return;
    try {
        const response = await fetch(`${SAMPLE_API_BASE_URL}/delete/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 200) {
            alert('删除成功！');
            fetchSamples();
        } else {
            throw new Error(data.msg || '删除失败');
        }
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage < 1 || newPage > totalPages) return;
    fetchSamples(newPage, currentSearch);
}

function searchSamples() {
    const kw = document.getElementById('search-example').value.trim();
    currentSearch = kw;
    fetchSamples(1, currentSearch);
}
// 页面加载时获取样例问题
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fetchSamples(1, ''));
} else {
    fetchSamples(1, '');
} 