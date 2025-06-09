// File BARU: js/recover.js
document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const verifyFaceBtn = document.getElementById('verifyFaceBtn');
    const messageEl = document.getElementById('message');
    const recoveryStep1 = document.getElementById('recoveryStep1');
    const recoveryStep2 = document.getElementById('recoveryStep2');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const recoveredUsernameEl = document.getElementById('recoveredUsername');

    let matchedUser = null;

    // Muat model face-api
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]);

    // Mulai kamera
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
    } catch (err) {
        messageEl.textContent = "Kamera tidak bisa diakses.";
        messageEl.className = 'message error';
    }

    // Event listener untuk verifikasi wajah
    verifyFaceBtn.addEventListener('click', async () => {
        messageEl.textContent = 'Mendeteksi wajah...';
        const detections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
        
        if (!detections) {
            messageEl.textContent = 'Wajah tidak terdeteksi. Posisikan wajah Anda di depan kamera.';
            messageEl.className = 'message error';
            return;
        }

        const users = JSON.parse(localStorage.getItem('app_users')) || [];
        const registeredUsers = users.filter(u => u.faceDescriptor);

        if (registeredUsers.length === 0) {
            messageEl.textContent = 'Tidak ada data wajah yang terdaftar di sistem.';
            messageEl.className = 'message error';
            return;
        }

        const labeledFaceDescriptors = registeredUsers.map(user =>
            new faceapi.LabeledFaceDescriptors(user.username, [Float32Array.from(user.faceDescriptor)])
        );

        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
        const bestMatch = faceMatcher.findBestMatch(detections.descriptor);

        if (bestMatch.label !== 'unknown') {
            matchedUser = users.find(u => u.username === bestMatch.label);
            messageEl.textContent = `Wajah dikenali sebagai ${matchedUser.fullName}!`;
            messageEl.className = 'message success';
            recoveredUsernameEl.textContent = matchedUser.username;
            recoveryStep1.style.display = 'none';
            recoveryStep2.style.display = 'block';
        } else {
            messageEl.textContent = 'Wajah tidak cocok dengan data manapun.';
            messageEl.className = 'message error';
        }
    });

    // Event listener untuk form reset password
    resetPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            messageEl.textContent = 'Konfirmasi password tidak cocok.';
            messageEl.className = 'message error';
            return;
        }

        const users = JSON.parse(localStorage.getItem('app_users'));
        const userIndex = users.findIndex(u => u.username === matchedUser.username);
        users[userIndex].password = newPassword;
        localStorage.setItem('app_users', JSON.stringify(users));

        messageEl.textContent = 'Password berhasil diubah! Anda akan diarahkan ke halaman login.';
        messageEl.className = 'message success';

        setTimeout(() => window.location.href = 'login.html', 2000);
    });
});
