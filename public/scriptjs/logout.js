document.addEventListener('DOMContentLoaded', function() {
    // 获取退出登录链接元素
    const logoutLink = document.getElementById('logout-link').querySelector('a');

    // 获取模态框相关元素
    const confirmModal = document.getElementById('confirm-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const confirmModalBtn = document.getElementById('confirm-modal-btn');

    // 绑定点击事件
    logoutLink.addEventListener('click', function(event) {
        event.preventDefault(); // 阻止默认跳转行为
        showConfirmModal();
    });

    // 关闭模态框
    closeModalBtn.addEventListener('click', hideConfirmModal);
    cancelModalBtn.addEventListener('click', hideConfirmModal);

    // 确认登出
    confirmModalBtn.addEventListener('click', function() {
        hideConfirmModal();
        logout();
    });

    function showConfirmModal() {
        confirmModal.classList.remove('hidden');
    }

    function hideConfirmModal() {
        confirmModal.classList.add('hidden');
    }

    function logout() {
        try {
            // 清除sessionStorage中的相关信息
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('user');

            // 清除localStorage中的相关信息
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('operatorId');
            localStorage.removeItem('avatar');

            console.log('用户已成功登出，相关存储信息已被清除。');

            // 跳转到登录页或其他指定页面
            const loginUrl = '../public/setting/login.html' // 登录页面URL
            window.location.href = loginUrl;

        } catch (error) {
            console.error('登出时发生错误:', error);
            alert('登出过程中出现错误，请稍后再试或联系管理员。');
        }
    }
});