// File: js/auth.js (VERSI DIPERBARUI)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageEl = document.getElementById('message');
    const faceLoginBtn = document.getElementById('faceLoginBtn'); // Tombol login wajah

    const sendTelegramNotification = (fullName, username) => {
        const message = `🎉 Pengguna Baru Mendaftar!\n\nNama: ${fullName}\nUsername: ${username}`;
        const functionUrl = 'https://URL_BACKEND_ANDA.onrender.com/send-message'; // Ganti dengan URL backend Anda

        fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        })
        .catch(err => console.error('Gagal menghubungi backend:', err));
    };

    // Logika form registrasi (Sama seperti sebelumnya)
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const username = document.getElementById('username').value.toLowerCase();
            const password = document.getElementById('password').value;

            const users = JSON.parse(localStorage.getItem('app_users')) || [];
            const userExists = users.some(user => user.username === username);

            if (userExists) {
                messageEl.textContent = 'Username sudah digunakan.';
                messageEl.className = 'message error';
                return;
            }

            users.push({ fullName, username, password, faceDescriptor: null }); // Tambah properti faceDescriptor
            localStorage.setItem('app_users', JSON.stringify(users));
            sendTelegramNotification(fullName, username);
            messageEl.textContent = 'Registrasi berhasil! Mengalihkan ke halaman login...';
            messageEl.className = 'message success';
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        });
    }

    // Logika form login (Sama seperti sebelumnya)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.toLowerCase();
            const password = document.getElementById('password').value;

            const users = JSON.parse(localStorage.getItem('app_users')) || [];
            const foundUser = users.find(user => user.username === username && user.password === password);

            if (foundUser) {
                localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
                window.location.href = 'index.html';
            } else {
                messageEl.textContent = 'Username atau password salah.';
                messageEl.className = 'message error';
            }
        });
    }

    // BARU: Logika untuk Tombol Login Wajah
    if (faceLoginBtn) {
        faceLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Sembunyikan form login biasa, tampilkan video
            const video = document.createElement('video');
            video.width = 320;
            video.height = 240;
            video.autoplay = true;
            video.muted = true;
            video.style.transform = 'scaleX(-1)';
            video.style.borderRadius = '8px';
            loginForm.parentNode.insertBefore(video, loginForm);
            loginForm.style.display = 'none';
            messageEl.textContent = 'Nyalakan kamera dan posisikan wajah Anda...';
            
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                video.srcObject = stream;
            } catch (err) {
                messageEl.textContent = "Kamera gagal diakses.";
                loginForm.style.display = 'block'; // Tampilkan form kembali
                video.remove();
                return;
            }

            // Coba deteksi wajah setiap detik
            const intervalId = setInterval(async () => {
                const detections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
                if (detections) {
                    clearInterval(intervalId); // Hentikan percobaan jika wajah terdeteksi
                    const users = JSON.parse(localStorage.getItem('app_users')) || [];
                    const registeredUsers = users.filter(u => u.faceDescriptor);

                    if(registeredUsers.length > 0){
                        const labeledFaceDescriptors = registeredUsers.map(user =>
                            new faceapi.LabeledFaceDescriptors(user.username, [Float32Array.from(user.faceDescriptor)])
                        );
                        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
                        const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
    
                        if (bestMatch.label !== 'unknown') {
                            const foundUser = users.find(u => u.username === bestMatch.label);
                            localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
                            messageEl.textContent = `Selamat datang, ${foundUser.fullName}!`;
                            messageEl.className = 'message success';
                            setTimeout(() => window.location.href = 'index.html', 1000);
                        } else {
                            messageEl.textContent = 'Wajah tidak dikenali.';
                            messageEl.className = 'message error';
                            loginForm.style.display = 'block';
                            video.remove();
                        }
                    } else {
                         messageEl.textContent = 'Tidak ada wajah terdaftar.';
                         messageEl.className = 'message error';
                         loginForm.style.display = 'block';
                         video.remove();
                    }
                }
            }, 1000);
        });
    }
});