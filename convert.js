const dropArea = document.getElementById('drop-area');
const previewImage = document.getElementById('preview');
const fileInput = document.getElementById('file-input');
const selectButton = document.getElementById('select-button');
const copyButton = document.getElementById('copy-button');
const message = document.getElementById('message');
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const downloadButton = document.getElementById('download-button');
const internalImage = document.getElementById('internal-image')
var text = '';

// ダウンロードボタンがクリックされたときの処理
downloadButton.addEventListener('click', () => {
    // 文字列をBlob化
    const blob = new Blob([text], { type: 'text/plain' });

    // ダウンロード用のaタグ生成
    const a = document.createElement('a');
    a.href =  URL.createObjectURL(blob);
    a.download = 'sample.txt';
    a.click();
});

// コピーボタンがクリックされたときの処理
copyButton.addEventListener('click', () => {
    // クリップボードにコピー
    navigator.clipboard.writeText(text)
        .then(() => {
            // コピー成功時にメッセージを表示
            message.textContent = 'クリップボードに保存しました。';
            message.style.display = 'block';

            setTimeout(() => {
                message.style.display = 'none';
            }, 5000);
        })
        .catch((err) => {
            console.error('コピーに失敗しました: ', err);
        });
});

dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.style.borderColor = 'blue';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = '#ccc';
});

// 画像がドロップされた時の処理
dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.style.borderColor = '#ccc';

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        loadImage(files[0]);
    }
});

// 画像を選択ボタンがクリックされたときの処理
selectButton.addEventListener('click', () => {
    fileInput.click(); // 隠れたinputをクリック
});

// ファイルが選択されたときの処理
fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (files.length > 0) {
        loadImage(files[0]);
    }
});

// 画像を読み込む関数
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        internalImage.src = e.target.result; //処理用画像ロード

        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        dropArea.innerHTML = '';
        dropArea.style.border = 'none';
        dropArea.appendChild(previewImage);

        internalImage.onload = () => {
            // Canvasのサイズを画像に合わせる
            console.log(internalImage.width + ", " + internalImage.height);
            canvas.width = internalImage.width;
            canvas.height = internalImage.height;
            // 画像をCanvasに描画
            ctx.drawImage(internalImage, 0, 0);

            // ピクセル毎のRGBを非同期に取得
            setTimeout(() => {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                text = '';

                const dataLength = data.length;
                let f = -1;
                console.log(dataLength);
                for (let i = 0; i < dataLength; i += 4) { //最大 3/2倍になってしまう U+0000からU+007Fまでを使う事で8/7倍で抑えられる
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    if (f == -1) {
                        text += String.fromCharCode(r + g * 256);
                        f = b;
                        if (i + 1 == dataLength) text += String.fromCharCode(b);
                    } else {
                        text += String.fromCharCode(f + r * 256, g + b * 256);
                        f = -1;
                    }
                }
                message.textContent = '画像を文字列に変換しました。';
                message.style.display = 'block';
            }, 0);
        };
    };
    reader.readAsDataURL(file);
}