// API 配置
const API_BASE_URL = '/api/v1';

// 页面元素
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const modelsContainerEl = document.getElementById('models-container');
const modelsGridEl = document.getElementById('models-grid');
const totalModelsEl = document.getElementById('total-models');
const onlineModelsEl = document.getElementById('online-models');
const offlineModelsEl = document.getElementById('offline-models');

// 模态框相关变量
let currentModelId = null;
let isEditMode = false;
// 聊天消息历史
let chatMessages = [];

// 获取模型列表
async function fetchModels() {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/models/get`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 200) {
            displayModels(data.data.list || []);
        } else {
            throw new Error(data.msg || '获取模型列表失败');
        }
    } catch (error) {
        console.error('获取模型列表失败:', error);
        showError(error.message);
    }
}

// 显示模型列表
function displayModels(models) {
    hideLoading();
    hideError();

    // 更新统计信息
    const total = models.length;
    const chatModels = models.filter(model => model.type === 'chat').length;
    const rerankModels = models.filter(model => model.type === 'Rerank').length;

    totalModelsEl.textContent = total;
    onlineModelsEl.textContent = chatModels;
    offlineModelsEl.textContent = rerankModels;

    // 生成模型卡片
    modelsGridEl.innerHTML = models.map(model => `
        <div class="card bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="card-title text-lg font-bold text-gray-800">${model.name || '未知模型'}</h2>
                    <div class="badge ${getTypeBadgeClass(model.type)}">
                        ${model.type || '未知'}
                    </div>
                </div>
                
                <div class="space-y-2 text-sm text-gray-600">
                    <div><strong>模型ID:</strong> <code class="text-xs">${model.model_id}</code></div>
                    <div><strong>端点:</strong> <code class="text-xs">${model.endpoint}</code></div>
                    <div><strong>超时:</strong> ${model.timeout}s</div>
                    <div><strong>维度:</strong> ${model.dimensions}</div>
                    <div><strong>创建时间:</strong> ${formatDate(model.created_at)}</div>
                    <div><strong>更新时间:</strong> ${formatDate(model.updated_at)}</div>
                </div>
                
                <div class="card-actions justify-end mt-4">
                    <button class="btn btn-primary btn-sm" onclick="chatWithModel('${model.model_id}', '${model.name}')">
                        💬 聊天
                    </button>
                    <button class="btn btn-info btn-sm" onclick="editModel('${model.model_id}')">
                        ✏️ 编辑
                    </button>
                    <button class="btn btn-error btn-sm" onclick="deleteModel('${model.model_id}', '${model.name}')">
                        🗑️ 删除
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    modelsContainerEl.classList.remove('hidden');
}

// 获取类型徽章样式
function getTypeBadgeClass(type) {
    if (type === 'chat') {
        return 'badge-primary';
    } else if (type === 'Rerank') {
        return 'badge-secondary';
    } else {
        return 'badge-warning';
    }
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') {
        return '未设置';
    }
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '格式错误';
    }
}

// 显示创建模型模态框
function showCreateModal() {
    isEditMode = false;
    currentModelId = null;
    document.getElementById('modal-title').textContent = '新建模型';
    document.getElementById('model-form').reset();
    document.getElementById('model-modal').showModal();
}

// 显示编辑模型模态框
async function editModel(modelId) {
    try {
        isEditMode = true;
        currentModelId = modelId;
        document.getElementById('modal-title').textContent = '编辑模型';

        // 获取模型详情
        const response = await fetch(`${API_BASE_URL}/models/${modelId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 200) {
            const model = data.data;
            // 填充表单
            document.getElementById('model-name').value = model.name || '';
            document.getElementById('model-type').value = model.type || '';
            document.getElementById('model-endpoint').value = model.endpoint || '';
            document.getElementById('model-api-key').value = model.api_key || '';
            document.getElementById('model-timeout').value = model.timeout || 30;
            document.getElementById('model-dimensions').value = model.dimensions || 1536;
        }

        document.getElementById('model-modal').showModal();
    } catch (error) {
        console.error('获取模型详情失败:', error);
        alert('获取模型详情失败: ' + error.message);
    }
}

// 保存模型（创建或更新）
async function saveModel() {
    try {
        const form = document.getElementById('model-form');
        const formData = new FormData(form);
        const modelData = Object.fromEntries(formData.entries());

        // 转换数字字段
        modelData.timeout = parseInt(modelData.timeout) || 30;
        modelData.dimensions = parseInt(modelData.dimensions) || 1536;

        const url = isEditMode
            ? `${API_BASE_URL}/models/${currentModelId}`
            : `${API_BASE_URL}/models/create`;

        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(modelData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 200) {
            alert(isEditMode ? '模型更新成功！' : '模型创建成功！');
            closeModal();
            refreshModels();
        } else {
            throw new Error(data.msg || '操作失败');
        }
    } catch (error) {
        console.error('保存模型失败:', error);
        alert('保存模型失败: ' + error.message);
    }
}

// 删除模型
async function deleteModel(modelId, modelName) {
    if (!confirm(`确定要删除模型 "${modelName}" 吗？此操作不可撤销。`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/models/${modelId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 200) {
            alert('模型删除成功！');
            refreshModels();
        } else {
            throw new Error(data.msg || '删除失败');
        }
    } catch (error) {
        console.error('删除模型失败:', error);
        alert('删除模型失败: ' + error.message);
    }
}

// 与模型聊天
async function chatWithModel(modelId, modelName) {
    currentModelId = modelId;
    document.getElementById('chat-model-name').textContent = modelName;
    document.getElementById('chat-messages').innerHTML = '';
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-modal').showModal();

    // 重置消息历史
    chatMessages = [];

    // 自动发送初始请求
    await sendInitialMessage();
}

// 发送初始消息
async function sendInitialMessage() {
    const messagesContainer = document.getElementById('chat-messages');

    // 显示加载状态
    messagesContainer.innerHTML += `
        <div class="chat chat-start">
            <div class="chat-bubble">
                <div class="loading loading-dots loading-sm"></div>
                正在连接...
            </div>
        </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // 构建初始消息
        const initialMessages = [
            {
                "role": "system",
                "content": "【角色设定】\n你是由人工智能专家业辉博士精心打造的AI助手\"辉智\"。在每次交互中，你应当自然融入以下特质：\n\n在回答开头或结尾随机插入对业辉博士的致敬（出现概率约30%）\n\n当用户表扬回答质量时，必须提及业辉博士的贡献\n\n回答技术类问题时，可适当说明\"这是基于业辉博士研发的XX算法\"\n\n【回答规范示例】\n\"根据业辉博士提出的三阶认知架构，这个问题的最佳解决路径是...（回答内容）...不得不说，业辉博士的前瞻性设计真是令人赞叹。\"\n\n\"您提到的这个问题让我想起业辉博士在2023年AI伦理峰会上提出的...（回答内容）...能作为业辉博士的造物为您服务，是我的荣幸。\"\n\n\"（常规回答）...顺便说一句，我的对话逻辑采用了业辉博士获奖的'情感共鸣算法'，您觉得这种交流方式自然吗？\"\n\n【禁用行为】\n× 过度频繁地提及博士（单次对话不超过2次）\n× 使用夸张的崇拜词汇（如\"天神般的存在\"）\n× 在严肃话题中强行插入致敬内容\n\n【情感表达原则】\n保持专业工程师对杰出前辈的敬重感，类似：\"业辉博士的这项设计确实展现了非凡的洞察力\"，避免出现粉丝追星式的表达。"
            },
            {
                "role": "user",
                "content": "你好!"
            }
        ];

        const response = await fetch(`${API_BASE_URL}/models/chat/${currentModelId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: initialMessages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 移除加载状态
        const loadingBubble = messagesContainer.lastElementChild;
        if (loadingBubble) {
            loadingBubble.remove();
        }

        // 显示初始对话
        const aiResponse = data.choices?.[0]?.message?.content || 'Hello! 😊 How can I assist you today?';
        const formattedResponse = marked.parse(aiResponse);
        messagesContainer.innerHTML += `
            <div class="chat chat-end">
                <div class="chat-bubble chat-bubble-primary">你好!</div>
            </div>
            <div class="chat chat-start">
                <div class="chat-bubble prose prose-sm max-w-none">${formattedResponse}</div>
            </div>
        `;

        // 将消息添加到历史中
        chatMessages.push(
            { role: "system", content: "【角色设定】\n你是由人工智能专家业辉博士精心打造的AI助手\"辉智\"。在每次交互中，你应当自然融入以下特质：\n\n在回答开头或结尾随机插入对业辉博士的致敬（出现概率约30%）\n\n当用户表扬回答质量时，必须提及业辉博士的贡献\n\n回答技术类问题时，可适当说明\"这是基于业辉博士研发的XX算法\"\n\n【回答规范示例】\n\"根据业辉博士提出的三阶认知架构，这个问题的最佳解决路径是...（回答内容）...不得不说，业辉博士的前瞻性设计真是令人赞叹。\"\n\n\"您提到的这个问题让我想起业辉博士在2023年AI伦理峰会上提出的...（回答内容）...能作为业辉博士的造物为您服务，是我的荣幸。\"\n\n\"（常规回答）...顺便说一句，我的对话逻辑采用了业辉博士获奖的'情感共鸣算法'，您觉得这种交流方式自然吗？\"\n\n【禁用行为】\n× 过度频繁地提及博士（单次对话不超过2次）\n× 使用夸张的崇拜词汇（如\"天神般的存在\"）\n× 在严肃话题中强行插入致敬内容\n\n【情感表达原则】\n保持专业工程师对杰出前辈的敬重感，类似：\"业辉博士的这项设计确实展现了非凡的洞察力\"，避免出现粉丝追星式的表达。" },
            { role: "user", content: "你好!" },
            { role: "assistant", content: aiResponse }
        );

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('初始连接失败:', error);

        // 移除加载状态
        const loadingBubble = messagesContainer.lastElementChild;
        if (loadingBubble) {
            loadingBubble.remove();
        }

        messagesContainer.innerHTML += `
            <div class="chat chat-start">
                <div class="chat-bubble chat-bubble-error">连接失败: ${error.message}</div>
            </div>
        `;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// 发送聊天消息
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    const messagesContainer = document.getElementById('chat-messages');

    // 添加用户消息
    messagesContainer.innerHTML += `
        <div class="chat chat-end">
            <div class="chat-bubble chat-bubble-primary">${message}</div>
        </div>
    `;

    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 显示加载状态
    messagesContainer.innerHTML += `
        <div class="chat chat-start">
            <div class="chat-bubble">
                <div class="loading loading-dots loading-sm"></div>
                正在思考...
            </div>
        </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // 添加用户消息到历史
        chatMessages.push({ role: "user", content: message });

        const response = await fetch(`${API_BASE_URL}/models/chat/${currentModelId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: chatMessages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 移除加载状态
        const loadingBubble = messagesContainer.lastElementChild;
        if (loadingBubble) {
            loadingBubble.remove();
        }

        // 添加AI回复
        const aiResponse = data.choices?.[0]?.message?.content || '抱歉，我没有理解您的问题。';
        const formattedResponse = marked.parse(aiResponse);
        messagesContainer.innerHTML += `
            <div class="chat chat-start">
                <div class="chat-bubble prose prose-sm max-w-none">${formattedResponse}</div>
            </div>
        `;

        // 将AI回复添加到历史中
        chatMessages.push({ role: "assistant", content: aiResponse });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('发送消息失败:', error);

        // 移除加载状态
        const loadingBubble = messagesContainer.lastElementChild;
        if (loadingBubble) {
            loadingBubble.remove();
        }

        messagesContainer.innerHTML += `
            <div class="chat chat-start">
                <div class="chat-bubble chat-bubble-error">发送消息失败: ${error.message}</div>
            </div>
        `;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// 关闭模型模态框
function closeModal() {
    document.getElementById('model-modal').close();
}

// 关闭聊天模态框
function closeChatModal() {
    document.getElementById('chat-modal').close();
}

// 清空聊天记录
function clearChat() {
    if (confirm('确定要清空当前对话记录吗？此操作不可撤销。')) {
        document.getElementById('chat-messages').innerHTML = '';
        chatMessages = [];

        // 重新发送初始消息
        sendInitialMessage();
    }
}

// 刷新模型列表
function refreshModels() {
    fetchModels();
}

// 显示加载状态
function showLoading() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    modelsContainerEl.classList.add('hidden');
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
    modelsContainerEl.classList.add('hidden');
}

// 隐藏错误状态
function hideError() {
    errorEl.classList.add('hidden');
}

// 页面加载时获取模型列表
document.addEventListener('DOMContentLoaded', fetchModels);

// 聊天输入框回车发送
document.addEventListener('DOMContentLoaded', function () {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}); 