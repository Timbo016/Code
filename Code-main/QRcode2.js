

// ----------- QR GENERATION ------------- //

async function encryptAndGenerateQR() {
    const patientName =document.getElementById('patientName').value
    const patientTitle=document.getElementById('patientTitle').value
    const patientMail =document.getElementById('patientEmail').value
    const patientNumber=document.getElementById('patientNumber').value
    const patientIllness =document.getElementById('patientIllness').value
    const illness=document.getElementById('patientDescription').value
    const text=`Name: ${patientTitle} ${patientName} \n Mail: ${patientMail} \n  Phone: ${patientNumber} 
    \n Illness: ${patientIllness}  \n Description: ${illness}`

    let password='123Police'
    if (!text || !password) {
        alert("Enter text and password!");
        return;
    }

    const encrypted = await encryptText(text);

    const jsonString = JSON.stringify(encrypted);
    // Clear previous QR
    console.log(jsonString)
    let QrcodeSpace=document.getElementById("patientQrCode").innerHTML 
    const qrContainer = document.createElement('div');
    const downloadButton = document.createElement('button');
    downloadButton.textContent='Download QR'
    downloadButton.addEventListener("click", downloadQrcode)
    downloadButton.style.margin='20px'
    QrcodeSpace= "";
    new QRCode(qrContainer, jsonString);
    document.getElementById('patientQrCode').appendChild(qrContainer);
    document.getElementById('patientQrCode').appendChild(downloadButton);
    document.getElementById("patientQrCode").style.display='block'
    document.getElementById('myForm').style.display='none'
}

// ----------- QR SCANNING ------------- //

function startScan(text) {
    const reader = new Html5Qrcode("reader");

    reader.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (qrText) => {
            reader.stop();

            try {
                const encryptedObj = JSON.parse(qrText);
                const password = prompt("Enter password to decrypt:");

                const decrypted = await decryptText(encryptedObj,password);
                document.getElementById("decryptedOutput").innerText = decrypted;

            } catch (err) {
                alert("Invalid QR code or wrong password!");
            }
        }
    );
}


document.getElementById("myForm").addEventListener("submit", function (event) {
    const requiredFields = this.querySelectorAll("[required]");
    let allFilled = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.border = "2px solid red";  // highlight empty field
            allFilled = false;
        } else {
            field.style.border = ""; // remove highlight if filled
        }
    });

    if (!allFilled) {
        event.preventDefault(); // stop form submission
        alert("Please fill all required fields.");
    }
    else{
        event.preventDefault()
        encryptAndGenerateQR()
        alert('Your information has been submitted')
    }
});



function downloadQrcode() {
    const barcodeDiv = document.getElementById("patientQrCode");
    const img = barcodeDiv.querySelector("img");
    let imageURL;
    if (img) {
        imageURL = img.src;
    } 
    else {
        alert("No QR found to download!");
        return;
    }

    // Create a canvas to draw the image
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Wait for image to fully load
    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous"; // important for canvas
        
    tempImg.onload = function() {
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;

        // Draw image on canvas
        context.drawImage(tempImg, 0, 0);

        // Convert canvas to Data URL (PNG)
        const imageURL = canvas.toDataURL("image/png");

        // Create temporary download link
        const link = document.createElement("a");
        link.href = imageURL;
        link.download = "qrcode.png";

        // Required for mobile
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    tempImg.src = img.src;
}



async function getKey(password) {
    password='123Police'
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("fixed-salt"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptText(text) {
  
    const password = '123Police'
    const output = document.getElementById("output");

    try {
        const key = await getKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();

        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            enc.encode(text)
        );

        const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

        return JSON.stringify({
            iv: Array.from(iv),
            data: encryptedData
        }, null, 2);
    } catch (err) {
        alert( err);
    }
}

async function decryptText(text,password) {
    //const output = document.getElementById("output");

    try {
        const encryptedObj = JSON.parse(text);
        const key = await getKey(password);

        const iv = new Uint8Array(encryptedObj.iv);
        const encryptedData = Uint8Array.from(
            atob(encryptedObj.data),
            c => c.charCodeAt(0)
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encryptedData
        );

        console.log( new TextDecoder().decode(decrypted));
    } catch (err) {
        console.log("Error: " + err)
    }
}