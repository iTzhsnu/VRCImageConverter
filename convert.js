const dropArea = document.getElementById("drop-area");
const previewImage = document.getElementById("preview");
const fileInput = document.getElementById("file-input");
const selectButton = document.getElementById("select-button");
const copyButton = document.getElementById("copy-button");
const message = document.getElementById("message");
const canvas = document.getElementById("image-canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const downloadButton = document.getElementById("download-button");
const internalImage = document.getElementById("internal-image");
var text = "";

downloadButton.addEventListener("click", () => {
    if (text.length > 0) {
        const a = document.createElement("a");
        a.href =  URL.createObjectURL(new Blob([text], { type: "text/plain" }));
        a.download = "convertedImage.txt";
        a.click();
    } else {
        returnMessage("変換されている画像がありません。", "red");
    }
});

copyButton.addEventListener("click", () => {
    if (text.length > 0) {
        navigator.clipboard.writeText(text)
        .then(() => {
            returnMessage("クリップボードに保存しました。", "green");
        })
        .catch((err) => {
            console.error("コピーに失敗しました: ", err);
            returnMessage("コピーに失敗しました。", "red");
        });
    } else {
        returnMessage("変換されている画像がありません。", "red");
    }
});

dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.style.borderColor = "blue";
});

dropArea.addEventListener("dragleave", () => {
    dropArea.style.borderColor = "#ccc";
});

dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.style.borderColor = "#ccc";

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        loadAndConvertImage(files[0]);
    }
});

selectButton.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    const files = fileInput.files;
    if (files.length > 0) {
        loadAndConvertImage(files[0]);
    }
});

function loadAndConvertImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        internalImage.src = e.target.result; // 処理用画像ロード

        // 画像ロード
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
        dropArea.innerHTML = "";
        dropArea.style.border = "none";
        dropArea.appendChild(previewImage);

        // 画像を文字列に変換
        internalImage.onload = () => {
            const w = internalImage.width;
            const h = internalImage.height;

            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(internalImage, 0, 0);

            setTimeout(() => {
                text = "";

                let rgb = [];
                for (let i = 1; h >= i; ++i) {
                    const data = ctx.getImageData(0, h - i, w, 1).data;
                    const length = data.length;

                    for (let n = 0; length > n; n += 4) { //R G B を入れる
                        rgb.push(data[n], data[n + 1], data[n + 2]);
                    }
                }

                if (rgb.length > 100000000) { // メガバイトなのかメビバイトなのか不明なので、とりあえず100メガバイトで制限
                    returnMessage("画像サイズが大きすぎます。", "red", false);
                } else if (w > 65535 || h > 65535) {
                    returnMessage("画像の縦横のどちらかが極端に長すぎます。", "red", false); // Ex. 65536 x 5 ここまで極端な画像使わない...よね?
                } else {
                    convertToBase64([w & 0xff, w >> 8, h & 0xff, h >> 8]); // WidthとHeightを変換

                    convertToBase64(rgb); //RGBを変換
                    returnMessage("画像を文字列に変換しました。", "green", false);
                }
                
            }, 0);
        };
    };
    reader.readAsDataURL(file);
}

function convertToBase64(data) {
    const length = data.length;
    let string = "";

    for (let i = 0; length > i; i += 3) {
        const value1 = data[i] >> 2;
        if (length - i > 2) {
            const value2 = ((data[i] & 0x3) << 4) + (data[i + 1] >> 4);
            const value3 = ((data[i + 1] & 0xF) << 2) + (data[i + 2] >> 6);
            const value4 = (data[i + 2] & 0x3F);

            string += base64Table(value1) + base64Table(value2) + base64Table(value3) + base64Table(value4);
        } else {
            if (length - i > 0) {
                const value2 = ((data[i] & 0x3) << 4) + (data[i + 1] >> 4);
                if (length - i > 1) {
                    const value3 = ((data[i + 1] & 0xF) << 2) + (data[i + 2] >> 6);

                    string += base64Table(value1) + base64Table(value2) + base64Table(value3) + "=";
                } else {
                    string += base64Table(value1) + base64Table(value2) + base64Table((data[i + 1] & 0xF) << 2) + "=";
                }
            } else {
                string += base64Table(value1) + base64Table((data[i] & 0x3) << 4) + "==";
            }
        }
    }

    text += string;
}

function base64Table(i) {
    if (i < 26) { // 0 to 25 => A to Z
        return String.fromCharCode(i + 65); // 65 to 90 (UTF+0041 to UTF+005A)
    } else if (i < 52) { // 26 to 51 => a to z
        return String.fromCharCode(i + 71); // 97 to 122 (UTF+0061 to UTF+007A)
    } else if (i < 62) { // 52 to 61 => 0 to 9
        return String.fromCharCode(i - 4); // 48 to 57 (UTF+0030 to UTF+0039)
    } else if (i == 62) { // 62 => +
        return String.fromCharCode(43); // 43 (UTF+002B)
    } else if (i == 63) { // 63 => /
        return String.fromCharCode(47); // 47 (UTF+002F)
    }
}

function returnMessage(text, color, useTimeOut = true) {
    message.textContent = text;
    message.style.color = color;
    
    if (useTimeOut) {
        setTimeout(() => {
            message.textContent = "\u00A0";
        }, 5000);
    }
}
