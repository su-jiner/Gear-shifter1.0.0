// 显示未开发提示框
function showNotDevelopedModal(message) {
    const modal = document.getElementById('notDevelopedModal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message || '此功能尚未开发完成，请敬请期待。';
    modal.classList.remove('hidden'); // 移除隐藏类
    modal.classList.add('active'); // 添加激活类
}

// 隐藏未开发提示框
function hideNotDevelopedModal() {
    const modal = document.getElementById('notDevelopedModal');
    modal.classList.remove('active'); // 移除激活类
    modal.classList.add('hidden'); // 添加隐藏类
}

// 监听按钮点击事件
document.getElementById('restoreButton').addEventListener('click', function () {
    showNotDevelopedModal('恢复功能尚未开发完成，请敬请期待。');
});

document.getElementById('uninstallDLCButton').addEventListener('click', function () {
    showNotDevelopedModal('卸DLC功能尚未开发完成，请敬请期待。');
});

// 监听关闭按钮点击事件
document.getElementById('closeModalBtn').addEventListener('click', function () {
    hideNotDevelopedModal(); // 隐藏未开发提示框
});