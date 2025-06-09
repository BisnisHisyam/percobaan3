// File: js/main.js (VERSI DIPERBARUI)
document.addEventListener('DOMContentLoaded', () => {
    // 1. OTENTIKASI DAN INISIALISASI
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    const welcomeMessage = document.getElementById('welcomeMessage');
    welcomeMessage.textContent = `Selamat datang, ${loggedInUser.fullName}!`;

    // BARU: Cek apakah wajah sudah terdaftar
    const allUsers = JSON.parse(localStorage.getItem('app_users')) || [];
    const currentUserData = allUsers.find(u => u.username === loggedInUser.username);
    if (!currentUserData || !currentUserData.faceDescriptor) {
        document.getElementById('faceRegBanner').style.display = 'block';
    }

    const tasks = JSON.parse(localStorage.getItem(`tasks_${loggedInUser.username}`)) || [];

    // 2. REFERENSI ELEMEN DOM
    const logoutBtn = document.getElementById('logoutBtn');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('taskForm');
    const taskListContainer = document.getElementById('taskListContainer');
    
    // 3. FUNGSI-FUNGSI UTAMA (Sama seperti sebelumnya)
    const renderTasks = () => {
        taskListContainer.innerHTML = '';
        if (tasks.length === 0) {
            taskListContainer.innerHTML = '<p>Anda belum memiliki tugas. Saatnya menambahkan!</p>';
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.dataset.id = task.id;

            const deadline = new Date(task.deadline);
            const now = new Date();
            const diff = deadline - now;
            
            let countdownText = '';
            if (diff < 0) {
                countdownText = 'Waktu Habis!';
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                countdownText = `Sisa waktu: ${days} hari ${hours} jam`;
            }

            card.innerHTML = `
                <h4>${task.title}</h4>
                <p class="deadline">Deadline: ${deadline.toLocaleString('id-ID')}</p>
                <p class="countdown">${countdownText}</p>
                <div class="actions">
                    <button class="btn-icon edit-btn" title="Edit Tugas">✏️</button>
                    <button class="btn-icon delete-btn" title="Hapus Tugas">🗑️</button>
                </div>
            `;
            taskListContainer.appendChild(card);
        });
    };
    
    const saveTasks = () => {
        localStorage.setItem(`tasks_${loggedInUser.username}`, JSON.stringify(tasks));
    };

    const openModal = (task = null) => {
        taskForm.reset();
        const modalTitle = document.getElementById('modalTitle');
        if (task) {
            modalTitle.textContent = 'Edit Tugas';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDeadline').value = task.deadline;
        } else {
            modalTitle.textContent = 'Tambah Tugas Baru';
            document.getElementById('taskId').value = '';
        }
        taskModal.style.display = 'block';
    };

    const closeModal = () => {
        taskModal.style.display = 'none';
    };

    // 4. EVENT LISTENERS (Sama seperti sebelumnya)
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    });

    addTaskBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === taskModal) closeModal(); });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('taskId').value;
        const title = document.getElementById('taskTitle').value;
        const deadline = document.getElementById('taskDeadline').value;

        if (id) {
            const taskIndex = tasks.findIndex(t => t.id == id);
            tasks[taskIndex] = { ...tasks[taskIndex], title, deadline };
        } else {
            const newTask = { id: Date.now(), title, deadline, notified: false };
            tasks.push(newTask);
        }
        
        saveTasks();
        renderTasks();
        closeModal();
    });

    taskListContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;
        const id = card.dataset.id;
        
        if (e.target.closest('.edit-btn')) {
            const taskToEdit = tasks.find(t => t.id == id);
            openModal(taskToEdit);
        }
        
        if (e.target.closest('.delete-btn')) {
            if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
                const taskIndex = tasks.findIndex(t => t.id == id);
                tasks.splice(taskIndex, 1);
                saveTasks();
                renderTasks();
            }
        }
    });

    // 5. FITUR TAMBAHAN (Sama, tidak ada perubahan)
    const checkDeadlinesAndNotify = () => {
        // ... (logika notifikasi deadline)
    };
    
    renderTasks();
    setInterval(checkDeadlinesAndNotify, 1000 * 60 * 30);
});