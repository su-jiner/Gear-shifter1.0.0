function showLoginModal(message, redirectUrl) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-modal-message');

    // 设置错误信息
    errorMessage.textContent = message;

    // 显示模态框
    errorModal.classList.remove('hidden');

    // 绑定关闭按钮事件
    document.getElementById('close-error-modal-btn').addEventListener('click', function() {
        hideLoginModal();
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    });

    document.getElementById('ok-error-modal-btn').addEventListener('click', function() {
        hideLoginModal();
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    });
}

function hideLoginModal() {
    const errorModal = document.getElementById('error-modal');
    errorModal.classList.add('hidden');
}

function checkLoginStatus(jwtTokenKey, operatorIdKey, message, redirectUrl) {
    const jwtToken = localStorage.getItem(jwtTokenKey);
    const operatorId = localStorage.getItem(operatorIdKey);

    if (!jwtToken || !operatorId) {
        showLoginModal(message, redirectUrl);
        return false;
    }

    return true;
}