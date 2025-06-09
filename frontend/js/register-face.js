// File: js/register-face.js (VERSI DITINGKATKAN)
document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('captureBtn');
    const statusEl = document.getElementById('status');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // Cek apakah user login
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load model face-api
    statusEl.textContent = "Memuat model AI, mohon tunggu...";
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        statusEl.textContent = "Model AI siap! Mengaktifkan kamera...";
    } catch (err) {
        statusEl.textContent = "Gagal memuat model AI.";
        statusEl.className = 'message error';
        console.error('Model Load Error:', err);
        return;
    }

    // Nyalakan kamera
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        statusEl.textContent = "Posisikan wajah Anda di kamera dan klik tombol.";
    } catch (err) {
        statusEl.textContent = "Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.";
        statusEl.className = 'message error';
        console.error('Camera Access Error:', err);
        return;
    }

    // Tombol capture
    captureBtn.addEventListener('click', async () => {
        statusEl.textContent = "Memproses deteksi wajah...";
        try {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                statusEl.textContent = "Wajah tidak terdeteksi. Coba posisikan wajah lebih jelas.";
                statusEl.className = 'message error';
                return;
            }

            const descriptor = detections.descriptor;
            const users = JSON.parse(localStorage.getItem('app_users')) || [];
            const userIndex = users.findIndex(u => u.username === loggedInUser.username);

            if (userIndex === -1) {
                statusEl.textContent = "Data pengguna tidak ditemukan.";
                statusEl.className = 'message error';
                return;
            }

            // Simpan descriptor
            users[userIndex].faceDescriptor = Array.from(descriptor);
            localStorage.setItem('app_users', JSON.stringify(users));

            // Screenshot wajah untuk notifikasi
            const canvas = faceapi.createCanvasFromMedia(video);
            faceapi.matchDimensions(canvas, { width: video.width, height: video.height });
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, video.width, video.height);
            const imageDataUrl = canvas.toDataURL('image/jpeg');

            // Kirim ke Telegram (opsional)
            await sendFaceImageToTelegram(loggedInUser.fullName, imageDataUrl);

            statusEl.textContent = "Wajah berhasil didaftarkan! Anda akan diarahkan ke halaman utama.";
            statusEl.className = 'message success';

            setTimeout(() => window.location.href = 'index.html', 2000);

        } catch (err) {
            statusEl.textContent = "Terjadi kesalahan saat memproses wajah.";
            statusEl.className = 'message error';
            console.error('Face Capture Error:', err);
        }
    });
});

async function sendFaceImageToTelegram(fullName, imageDataUrl) {
    const caption = `Wajah Pengguna Berhasil Didaftarkan!\n\nNama: ${fullName}`;
    const functionUrl = 'https://URL_BACKEND_ANDA.onrender.com/send-face-image';

    try {
        await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caption: caption,
                imageData: imageDataUrl
            })
        });
    } catch (err) {
        console.error('Gagal mengirim gambar ke Telegram:', err);
    }
}
