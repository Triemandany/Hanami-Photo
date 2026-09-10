// script.js

(function(){

"use strict";


const CONFIG={
    countdownSeconds:3,
    delayBetweenPhotos:1000,
    cameraWidth:1280,
    cameraHeight:720
};


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const GAS_CONFIG={
    webAppUrl:"https://script.google.com/macros/s/AKfycbwWXYyT5bj0lmIRilLSJ1gyo6m5DViE7MnPGSTUg40Zw4lFYW6aa1jjMnuB_Bp9TV9OSA/exec"
};


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations={

    ja:{
        subtitle:"春 · フォトブース",
        cameraTitle:"カメラ",
        previewTitle:"テンプレートプレビュー",
        gridLayout:"テンプレート",
        theme:"テーマ",
        startCapture:"撮影スタート",
        reset:"リセット",
        support:"Hanamiを応援",
        supportTitle:"Hanamiを応援",
        supportDescription:"このフォトブースが気に入ったら、Hanamiの応援をお願いします。ご支援は新しい機能やテンプレートの開発に役立ちます。",
        supportViaSaweria:"Saweriaで応援する",
        supportThanks:"Hanamiを応援していただきありがとうございます ✿",
        save:"ローカル保存",
        email:"メール送信",
        retake:"撮り直す",
        print:"プリント"
    },

    en:{
        subtitle:"Spring · Photobooth",
        cameraTitle:"Camera",
        previewTitle:"Template Preview",
        gridLayout:"Template",
        theme:"Theme",
        startCapture:"Start Capture",
        reset:"Reset",
        support:"Support Hanami",
        supportTitle:"Support Hanami",
        supportDescription:"Like this photobooth? Your support helps us develop new features and templates.",
        supportViaSaweria:"Support via Saweria",
        supportThanks:"Thank you for supporting Hanami ✿",
        save:"Save Local",
        email:"Send Email",
        retake:"Retake",
        print:"Print"
    },

    id:{
        subtitle:"Musim Semi · Photobooth",
        cameraTitle:"Kamera",
        previewTitle:"Preview Template",
        gridLayout:"Template",
        theme:"Tema",
        startCapture:"Mulai Foto",
        reset:"Reset",
        support:"Support Hanami",
        supportTitle:"Support Hanami",
        supportDescription:"Suka dengan photobooth ini? Dukungan kamu membantu kami mengembangkan fitur dan template baru.",
        supportViaSaweria:"Support via Saweria",
        supportThanks:"Terima kasih sudah mendukung Hanami ✿",
        save:"Save Local",
        email:"Kirim Email",
        retake:"Foto Ulang",
        print:"Print"
    }

};


const TEMPLATES={

    "1x1":{
        name:"1 × 1",
        paper:"4R",
        size:"10.2 × 15.2 cm",
        photos:1,
        cols:1,
        rows:1
    },

    "2x2":{
        name:"2 × 2",
        paper:"4R",
        size:"10.2 × 15.2 cm",
        photos:4,
        cols:2,
        rows:2
    },

    "2x3":{
        name:"2 × 3",
        paper:"4R",
        size:"10.2 × 15.2 cm",
        photos:6,
        cols:2,
        rows:3
    }

};


const THEME_TITLES={

    classic:"HANAMI MEMORY",
    clean:"HANAMI MEMORY",
    sakura:"SAKURA MEMORY",
    retro:"MEMORY FILM",
    botanical:"BOTANICAL MEMORY",
    love:"LOVE MEMORY",
    kawaii:"KAWAII MEMORY",
    elegant:"HANAMI EDITION",
    night:"MOONLIGHT MEMORY",
    polaroid:"MEMORIES"

};


let currentLang="id";
let selectedGrid="2x2";
let selectedTheme="clean";
let capturedImages=[];
let stream=null;
let captureInProgress=false;
let captureSession=0;
let resultDataURL=null;


const $=id=>
    document.getElementById(id);


const video=
    $("video");


const canvas=
    $("canvas");


const ctx=
    canvas.getContext("2d");


const resultCanvas=
    $("resultCanvas");


const startCaptureBtn=
    $("startCaptureBtn");


const languageSelect=
    $("languageSelect");


const themeSelect=
    $("themeSelect");


const gridOptions=
    document.querySelectorAll(
        ".grid-option"
    );


const captureOverlay=
    $("captureOverlay");


const cameraError=
    $("cameraError");


const templatePreview=
    $("templatePreview");


const templateInfo=
    $("templateInfo");


const captureStatus=
    $("captureStatus");


const statusText=
    $("statusText");


const resultModal=
    $("resultModal");


const resultImage=
    $("resultImage");


const resultInfo=
    $("resultInfo");


const closeResultBtn=
    $("closeResultBtn");


const saveResultBtn=
    $("saveResultBtn");


const emailResultBtn=
    $("emailResultBtn");


const printResultBtn=
    $("printResultBtn");


const resetResultBtn=
    $("resetResultBtn");


const supportResultBtn=
    $("supportResultBtn");


const supportModal=
    $("supportModal");


const closeSupportBtn=
    $("closeSupportBtn");


const emailPanel=
    $("emailPanel");


const emailInput=
    $("emailInput");


const sendEmailBtn=
    $("sendEmailBtn");


const emailStatus=
    $("emailStatus");


/* =========================================================
   UTILITY
========================================================= */

function sleep(ms){

    return new Promise(
        resolve=>
            setTimeout(
                resolve,
                ms
            )
    );

}


function updateStatus(text){

    statusText.textContent=
        text;

}


function updateCaptureStatus(){

    captureStatus.textContent=
        `${capturedImages.length} / ${TEMPLATES[selectedGrid].photos}`;

}


function themeTitle(){

    return (
        THEME_TITLES[selectedTheme] ||
        "HANAMI MEMORY"
    );

}


/* =========================================================
   LANGUAGE
========================================================= */

function applyLanguage(lang){

    currentLang=
        translations[lang]
            ? lang
            : "id";


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(
            el=>{

                const key=
                    el.dataset.i18n;


                if(
                    translations[currentLang][key]
                ){

                    el.textContent=
                        translations[currentLang][key];

                }

            }
        );

}


languageSelect.addEventListener(
    "change",
    event=>{

        applyLanguage(
            event.target.value
        );

    }
);


/* =========================================================
   FALLING PETALS
========================================================= */

function createPetals(){

    const container=
        $("petal-container");


    const symbols=[
        "🌸",
        "🌸",
        "✿",
        "🍃",
        "✨"
    ];


    for(
        let i=0;
        i<20;
        i++
    ){

        const petal=
            document.createElement(
                "div"
            );


        petal.className=
            "petal";


        petal.textContent=
            symbols[
                Math.floor(
                    Math.random()*
                    symbols.length
                )
            ];


        petal.style.left=
            `${Math.random()*100}%`;


        petal.style.fontSize=
            `${14+Math.random()*15}px`;


        petal.style.opacity=
            `${.2+Math.random()*.45}`;


        petal.style.animationDuration=
            `${7+Math.random()*8}s`;


        petal.style.animationDelay=
            `${Math.random()*-15}s`;


        container.appendChild(
            petal
        );

    }

}


/* =========================================================
   CAMERA
========================================================= */

async function initCamera(){

    if(
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ){

        showCameraError();

        return;

    }


    try{

        stream=
            await navigator.mediaDevices.getUserMedia({

                video:{
                    width:{
                        ideal:
                            CONFIG.cameraWidth
                    },

                    height:{
                        ideal:
                            CONFIG.cameraHeight
                    },

                    facingMode:
                        "user"
                },

                audio:false

            });


        video.srcObject=
            stream;


        video.onloadedmetadata=
            ()=>{

                video
                    .play()
                    .catch(
                        ()=>{}
                    );

            };


        startCaptureBtn.disabled=
            false;


        cameraError.classList.add(
            "hidden"
        );


        updateStatus(
            "Kamera siap. Pilih template lalu mulai foto."
        );


    }catch(error){

        console.warn(
            "Camera error:",
            error
        );


        showCameraError();

    }

}


function showCameraError(){

    cameraError.classList.remove(
        "hidden"
    );


    startCaptureBtn.disabled=
        true;


    updateStatus(
        "Kamera tidak dapat digunakan."
    );

}


function stopCamera(){

    if(!stream){
        return;
    }


    stream
        .getTracks()
        .forEach(
            track=>{
                track.stop();
            }
        );


    stream=null;

}


/* =========================================================
   GRID
========================================================= */

gridOptions.forEach(
    button=>{

        button.addEventListener(
            "click",
            ()=>{

                if(
                    captureInProgress
                ){

                    return;

                }


                gridOptions.forEach(
                    item=>{

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedGrid=
                    button.dataset.grid;


                capturedImages=[];


                resultDataURL=
                    null;


                updateCaptureStatus();


                renderTemplatePreview();


                updateTemplateInfo();


                updateStatus(
                    `Template ${TEMPLATES[selectedGrid].name} dipilih.`
                );

            }
        );

    }
);


/* =========================================================
   THEME
========================================================= */

themeSelect.addEventListener(
    "change",
    event=>{

        if(
            captureInProgress
        ){

            return;

        }


        selectedTheme=
            event.target.value;


        renderTemplatePreview();


        updateStatus(
            `Tema ${themeTitle()} dipilih.`
        );

    }
);


/* =========================================================
   TEMPLATE INFO
========================================================= */

function updateTemplateInfo(){

    const template=
        TEMPLATES[selectedGrid];


    templateInfo.textContent=
        `${template.name} · ${template.paper} · ${template.size}`;

}


/* =========================================================
   TEMPLATE PREVIEW
========================================================= */

function renderTemplatePreview(){

    const template=
        TEMPLATES[selectedGrid];


    templatePreview.innerHTML=
        "";


    const paper=
        document.createElement(
            "div"
        );


    paper.className=
        "paper";


    paper.dataset.layout=
        selectedGrid;


    paper.dataset.theme=
        selectedTheme;


    const title=
        document.createElement(
            "div"
        );


    title.className=
        "template-title";


    title.textContent=
        themeTitle();


    paper.appendChild(
        title
    );


    const grid=
        document.createElement(
            "div"
        );


    grid.className=
        "photo-grid";


    for(
        let i=0;
        i<template.photos;
        i++
    ){

        const slot=
            document.createElement(
                "div"
            );


        slot.className=
            "photo-slot";


        if(
            capturedImages[i]
        ){

            const image=
                document.createElement(
                    "img"
                );


            image.src=
                capturedImages[i];


            image.alt=
                `Photo ${i+1}`;


            slot.appendChild(
                image
            );


        }else{

            const number=
                document.createElement(
                    "span"
                );


            number.className=
                "photo-number";


            number.textContent=
                i+1;


            slot.appendChild(
                number
            );

        }


        grid.appendChild(
            slot
        );

    }


    paper.appendChild(
        grid
    );


    const watermark=
        document.createElement(
            "div"
        );


    watermark.className=
        "watermark";


    watermark.innerHTML=
        '<div class="watermark-brand">✿ Hanami ✿</div>' +
        '<div class="watermark-subtitle">PHOTO STUDIO</div>';


    paper.appendChild(
        watermark
    );


    templatePreview.appendChild(
        paper
    );

}


/* =========================================================
   CAPTURE FRAME
========================================================= */

function captureVideoFrame(){

    if(
        !video.videoWidth ||
        !video.videoHeight
    ){

        return null;

    }


    canvas.width=
        video.videoWidth;


    canvas.height=
        video.videoHeight;


    ctx.save();


    ctx.translate(
        canvas.width,
        0
    );


    ctx.scale(
        -1,
        1
    );


    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.restore();


    return canvas.toDataURL(
        "image/jpeg",
        .92
    );

}


/* =========================================================
   COUNTDOWN
========================================================= */

async function runCountdown(
    session
){

    for(
        let number=
            CONFIG.countdownSeconds;
        number>=1;
        number--
    ){

        if(
            session !==
            captureSession
        ){

            return false;

        }


        captureOverlay.textContent=
            number;


        captureOverlay.classList.add(
            "show"
        );


        await sleep(
            1000
        );

    }


    if(
        session !==
        captureSession
    ){

        return false;

    }


    captureOverlay.textContent=
        "📸";


    await sleep(
        150
    );


    captureOverlay.classList.remove(
        "show"
    );


    return true;

}


/* =========================================================
   START CAPTURE
========================================================= */

async function startCapture(){

    if(
        captureInProgress ||
        !stream
    ){

        return;

    }


    const template=
        TEMPLATES[selectedGrid];


    captureInProgress=
        true;


    captureSession++;


    const session=
        captureSession;


    capturedImages=[];


    resultDataURL=
        null;


    updateCaptureStatus();


    renderTemplatePreview();


    startCaptureBtn.disabled=
        true;


    themeSelect.disabled=
        true;


    gridOptions.forEach(
        button=>{

            button.disabled=
                true;

        }
    );


    try{

        for(
            let i=0;
            i<template.photos;
            i++
        ){

            if(
                session !==
                captureSession
            ){

                break;

            }


            updateStatus(
                `Siapkan pose untuk foto ${i+1} dari ${template.photos}.`
            );


            const countdownOK=
                await runCountdown(
                    session
                );


            if(!countdownOK){

                break;

            }


            const shot=
                captureVideoFrame();


            if(!shot){

                throw new Error(
                    "Kamera belum siap."
                );

            }


            capturedImages.push(
                shot
            );


            updateCaptureStatus();


            renderTemplatePreview();


            updateStatus(
                `Foto ${i+1} berhasil diambil.`
            );


            if(
                i<
                template.photos-1
            ){

                await sleep(
                    CONFIG.delayBetweenPhotos
                );

            }

        }


        if(
            session ===
            captureSession &&

            capturedImages.length ===
            template.photos
        ){

            updateStatus(
                "Semua foto berhasil diambil. Menyusun hasil..."
            );


            await composeFinalImage();

        }


    }catch(error){

        console.error(
            "Capture error:",
            error
        );


        alert(
            error.message ||
            "Terjadi kesalahan saat mengambil foto."
        );


    }finally{

        captureInProgress=
            false;


        if(
            session ===
            captureSession
        ){

            startCaptureBtn.disabled=
                false;


            themeSelect.disabled=
                false;


            gridOptions.forEach(
                button=>{

                    button.disabled=
                        false;

                }
            );

        }

    }

}


startCaptureBtn.addEventListener(
    "click",
    startCapture
);


/* =========================================================
   IMAGE UTILITIES
========================================================= */

function loadImage(
    src
){

    return new Promise(
        (
            resolve,
            reject
        )=>{

            const image=
                new Image();


            image.onload=
                ()=>{

                    resolve(
                        image
                    );

                };


            image.onerror=
                ()=>{

                    reject(
                        new Error(
                            "Gagal memuat hasil foto."
                        )
                    );

                };


            image.src=
                src;

        }
    );

}


function drawCoverImage(
    context,
    image,
    x,
    y,
    width,
    height
){

    const scale=
        Math.max(
            width /
            image.width,

            height /
            image.height
        );


    const sourceWidth=
        width /
        scale;


    const sourceHeight=
        height /
        scale;


    const sourceX=
        (
            image.width -
            sourceWidth
        ) / 2;


    const sourceY=
        (
            image.height -
            sourceHeight
        ) / 2;


    context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        x,
        y,
        width,
        height
    );

}


/* =========================================================
   THEME BACKGROUND
========================================================= */

function drawThemeBackground(
    context,
    width,
    height
){

    const gradient=
        context.createLinearGradient(
            0,
            0,
            width,
            height
        );


    if(
        selectedTheme ===
        "elegant"
    ){

        gradient.addColorStop(
            0,
            "#111111"
        );


        gradient.addColorStop(
            1,
            "#222222"
        );


    }else if(
        selectedTheme ===
        "night"
    ){

        gradient.addColorStop(
            0,
            "#171a35"
        );


        gradient.addColorStop(
            1,
            "#2b2450"
        );


    }else if(
        selectedTheme ===
        "retro"
    ){

        gradient.addColorStop(
            0,
            "#f8f1e4"
        );


        gradient.addColorStop(
            1,
            "#e7dac4"
        );


    }else if(
        selectedTheme ===
        "botanical"
    ){

        gradient.addColorStop(
            0,
            "#fbfaf0"
        );


        gradient.addColorStop(
            1,
            "#e9efdc"
        );


    }else if(
        selectedTheme ===
        "polaroid"
    ){

        gradient.addColorStop(
            0,
            "#f7f3ea"
        );


        gradient.addColorStop(
            1,
            "#eee7d8"
        );


    }else if(
        selectedTheme ===
        "love"
    ){

        gradient.addColorStop(
            0,
            "#fff9f4"
        );


        gradient.addColorStop(
            1,
            "#ffe9ef"
        );


    }else{

        gradient.addColorStop(
            0,
            "#ffffff"
        );


        gradient.addColorStop(
            1,
            selectedTheme ===
            "sakura"

                ? "#fff0f5"

                : "#fffaf7"
        );

    }


    context.fillStyle=
        gradient;


    context.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =========================================================
   TEXT
========================================================= */

function drawText(
    context,
    text,
    x,
    y,
    size,
    fill,
    font="Montserrat"
){

    context.save();


    context.fillStyle=
        fill;


    context.font=
        `${size}px "${font}", sans-serif`;


    context.textAlign=
        "center";


    context.textBaseline=
        "middle";


    context.fillText(
        text,
        x,
        y
    );


    context.restore();

}


/* =========================================================
   DECORATIONS
========================================================= */

function drawDecorations(
    context,
    width,
    height
){

    const map={

        classic:[
            "🌸",
            "🌸"
        ],

        sakura:[
            "🌸",
            "🌸"
        ],

        botanical:[
            "🍃",
            "🌿"
        ],

        love:[
            "♡",
            "♥"
        ],

        kawaii:[
            "🧸",
            "★"
        ],

        night:[
            "☾",
            "✦"
        ],

        elegant:[
            "✦",
            "✦"
        ]

    };


    const decoration=
        map[selectedTheme];


    if(
        !decoration
    ){

        return;

    }


    const color=
        selectedTheme ===
        "elegant"

            ? "#d7bd7a"

            : "#e38fa7";


    drawText(
        context,
        decoration[0],
        30,
        48,
        38,
        color,
        "Segoe UI Emoji"
    );


    drawText(
        context,
        decoration[1],
        width-30,
        height-80,
        34,
        color,
        "Segoe UI Emoji"
    );

}


/* =========================================================
   WATERMARK
   MEDIUM - LARGE
========================================================= */

function drawWatermark(
    context,
    width,
    height,
    watermarkLineY=null
){

    const lineY =
        watermarkLineY !== null
            ? watermarkLineY
            : height - 108;


    context.save();


    context.strokeStyle =
        selectedTheme === "elegant"

            ? "#5d5135"

            : selectedTheme === "night"

                ? "#504879"

                : "#d8d8d8";


    context.lineWidth =
        2;


    context.beginPath();


    context.moveTo(
        width * 0.18,
        lineY
    );


    context.lineTo(
        width * 0.82,
        lineY
    );


    context.stroke();


    context.textAlign =
        "center";


    context.textBaseline =
        "middle";


    /* =========================
       HANAMI
       MEDIUM - LARGE
    ========================== */

    context.fillStyle =
        selectedTheme === "elegant"

            ? "#d7bd7a"

            : selectedTheme === "night"

                ? "#d7ceff"

                : "#777777";


    context.font =
        '800 54px "Nunito Sans", sans-serif';


    context.fillText(
        "✿ Hanami ✿",
        width / 2,
        lineY + 46
    );


    /* =========================
       PHOTO STUDIO
       MEDIUM
    ========================== */

    context.fillStyle =
        selectedTheme === "elegant"

            ? "#9f8d61"

            : selectedTheme === "night"

                ? "#9188b5"

                : "#9f999b";


    context.font =
        '600 17px "Montserrat", sans-serif';


    context.fillText(
        "P H O T O   S T U D I O",
        width / 2,
        lineY + 84
    );


    context.restore();

}


/* =========================================================
   COMPOSE FINAL
========================================================= */

async function composeFinalImage(){

    const template=
        TEMPLATES[selectedGrid];


    const sizes={

        "1x1":[
            1020,
            1520
        ],

        "2x2":[
            1020,
            1520
        ],

        "2x3":[
            1020,
            1520
        ]

    };


    const [
        width,
        height
    ]=
        sizes[selectedGrid];


    resultCanvas.width=
        width;


    resultCanvas.height=
        height;


    const context=
        resultCanvas.getContext(
            "2d"
        );


    drawThemeBackground(
        context,
        width,
        height
    );


    context.save();


    context.strokeStyle=
        selectedTheme ===
        "elegant"

            ? "#c8a85d"

            : selectedTheme ===
              "night"

                ? "#7566b3"

                : selectedTheme ===
                  "botanical"

                    ? "#9cac86"

                    : selectedTheme ===
                      "retro"

                        ? "#4f4640"

                        : "#efb8c5";


    context.lineWidth=
        3;


    context.strokeRect(
        8,
        8,
        width-16,
        height-16
    );


    context.restore();


    /* =====================================================
       TOP TEMPLATE TITLE
       SEMI-MEDIUM
    ====================================================== */

    drawText(
        context,
        themeTitle(),
        width/2,
        60,

        selectedTheme ===
        "elegant"

            ? 30
            : 34,

        selectedTheme ===
        "elegant"

            ? "#d7bd7a"

            : selectedTheme ===
              "night"

                ? "#d4c9ff"

                : "#987f86",

        selectedTheme ===
        "elegant"

            ? "Montserrat"

            : "Kalam"
    );


    let frameWidth;
    let frameHeight;
    let gap;
    let gridY;
    let watermarkGap;


    if(
        selectedGrid ===
        "1x1"
    ){

        frameWidth=
            775;

        frameHeight=
            959;

        gap=
            0;

        gridY=
            228;

        watermarkGap=
            45;


    }else if(
        selectedGrid ===
        "2x2"
    ){

        frameWidth=
            408;

        frameHeight=
            482;

        gap=
            41;

        gridY=
            225;

        watermarkGap=
            35;


    }else{

        frameWidth=
            326;

        frameHeight=
            326;

        gap=
            33;

        gridY=
            114;

        watermarkGap=
            45;

    }


    const gridWidth=
        template.cols *
        frameWidth +

        (
            template.cols -
            1
        ) *
        gap;


    const gridHeight=
        template.rows *
        frameHeight +

        (
            template.rows -
            1
        ) *
        gap;


    const gridX=
        (
            width -
            gridWidth
        ) / 2;


    const images=
        await Promise.all(
            capturedImages.map(
                loadImage
            )
        );


    images.forEach(
        (
            image,
            index
        )=>{

            const row=
                Math.floor(
                    index /
                    template.cols
                );


            const col=
                index %
                template.cols;


            const x=
                gridX+
                col*
                (
                    frameWidth+
                    gap
                );


            const y=
                gridY+
                row*
                (
                    frameHeight+
                    gap
                );


            context.save();


            context.shadowColor=
                "rgba(0,0,0,.12)";


            context.shadowBlur=
                0;


            context.shadowOffsetX=
                5;


            context.shadowOffsetY=
                5;


            context.fillStyle=
                "#ffffff";


            context.fillRect(
                x,
                y,
                frameWidth,
                frameHeight
            );


            context.restore();


            drawCoverImage(
                context,
                image,
                x,
                y,
                frameWidth,
                frameHeight
            );


            context.save();


            context.strokeStyle=
                selectedTheme ===
                "elegant"

                    ? "#c8a85d"

                    : selectedTheme ===
                      "night"

                        ? "#7064a0"

                        : selectedTheme ===
                          "botanical"

                            ? "#9cac86"

                            : "#d8d8d8";


            context.lineWidth=
                selectedTheme ===
                "retro"

                    ? 4

                    : 2;


            context.strokeRect(
                x,
                y,
                frameWidth,
                frameHeight
            );


            context.restore();

        }
    );


    drawDecorations(
        context,
        width,
        height
    );


    if(
        selectedTheme ===
        "retro"
    ){

        context.save();


        context.fillStyle=
            "#403832";


        context.font=
            '600 15px "Montserrat", sans-serif';


        context.textAlign=
            "center";


        context.fillText(
            "HANAMI FILM",
            width/2,
            height-77
        );


        context.restore();

    }


    if(
        selectedTheme ===
        "polaroid"
    ){

        context.save();


        context.fillStyle=
            "#796b62";


        context.font=
            '400 22px "Kalam", cursive';


        context.textAlign=
            "center";


        context.fillText(
            "memories",
            width/2,
            height-76
        );


        context.restore();

    }


    const gridBottom=
        gridY+
        gridHeight;


    const watermarkLineY=
        Math.min(
            gridBottom+
            watermarkGap,
            height-145
        );


    drawWatermark(
        context,
        width,
        height,
        watermarkLineY
    );


    resultDataURL=
        resultCanvas.toDataURL(
            "image/png",
            1
        );


    resultImage.src=
        resultDataURL;


    resultInfo.textContent=
        `${template.name} · ${template.paper} · ${template.size} · ${themeTitle()}`;


    showResultModal();

}


/* =========================================================
   RESULT MODAL
========================================================= */

function showResultModal(){

    resultModal.classList.add(
        "show"
    );


    resultModal.setAttribute(
        "aria-hidden",
        "false"
    );


    emailPanel.classList.add(
        "hidden"
    );


    emailInput.value=
        "";


    setEmailStatus(
        ""
    );


    sendEmailBtn.disabled=
        false;


    sendEmailBtn.innerHTML=
        '<i class="fas fa-paper-plane"></i> Kirim';

}


function closeResultModal(){

    resultModal.classList.remove(
        "show"
    );


    resultModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


closeResultBtn.addEventListener(
    "click",
    closeResultModal
);


/* =========================================================
   SUPPORT HANAMI
========================================================= */

function showSupportModal(){

    supportModal.classList.add(
        "show"
    );


    supportModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeSupportModal(){

    supportModal.classList.remove(
        "show"
    );


    supportModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


supportResultBtn.addEventListener(
    "click",
    showSupportModal
);


closeSupportBtn.addEventListener(
    "click",
    closeSupportModal
);


supportModal
    .querySelector(
        ".support-backdrop"
    )
    .addEventListener(
        "click",
        closeSupportModal
    );


document
    .querySelector(
        ".result-backdrop"
    )
    .addEventListener(
        "click",
        closeResultModal
    );


document.addEventListener(
    "keydown",
    event=>{

        if(
            event.key ===
            "Escape"
        ){

            closeResultModal();

            closeSupportModal();

        }

    }
);


/* =========================================================
   SAVE LOCAL
========================================================= */

saveResultBtn.addEventListener(
    "click",
    ()=>{

        if(
            !resultDataURL
        ){

            return;

        }


        const link=
            document.createElement(
                "a"
            );


        link.href=
            resultDataURL;


        link.download=
            `hanami-photobooth-${Date.now()}.png`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

    }
);


/* =========================================================
   EMAIL PANEL
========================================================= */

emailResultBtn.addEventListener(
    "click",
    ()=>{

        emailPanel.classList.toggle(
            "hidden"
        );


        if(
            !emailPanel.classList.contains(
                "hidden"
            )
        ){

            setTimeout(
                ()=>{

                    emailInput.focus();

                },
                100
            );

        }

    }
);


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );

}


function setEmailStatus(
    message,
    type=""
){

    emailStatus.textContent=
        message;


    emailStatus.className=
        `email-status ${type}`.trim();

}


/* =========================================================
   EMAIL ATTACHMENT
========================================================= */

function emailAttachment(){

    if(
        !resultDataURL
    ){

        return null;

    }


    return resultCanvas.toDataURL(
        "image/jpeg",
        .78
    );

}


/* =========================================================
   SEND TO GOOGLE APPS SCRIPT
========================================================= */

function sendResultByEmail(
    recipient
){

    return new Promise(
        (
            resolve,
            reject
        )=>{

            const endpoint=
                GAS_CONFIG.webAppUrl.trim();


            if(
                !endpoint ||
                endpoint.includes(
                    "PASTE_GOOGLE_APPS_SCRIPT"
                )
            ){

                reject(
                    new Error(
                        "URL Google Apps Script belum diisi."
                    )
                );


                return;

            }


            const attachment=
                emailAttachment();


            if(
                !attachment
            ){

                reject(
                    new Error(
                        "Hasil foto belum tersedia."
                    )
                );


                return;

            }


            const frameName=
                `hanamiMail_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2)}`;


            const iframe=
                document.createElement(
                    "iframe"
                );


            iframe.name=
                frameName;


            iframe.id=
                frameName;


            iframe.style.display=
                "none";


            document.body.appendChild(
                iframe
            );


            const form=
                document.createElement(
                    "form"
                );


            form.method=
                "POST";


            form.action=
                endpoint;


            form.target=
                frameName;


            form.style.display=
                "none";


            const fields={

                to_email:
                    recipient,

                session_time:
                    new Date()
                        .toLocaleString(
                            "id-ID",
                            {
                                dateStyle:
                                    "full",

                                timeStyle:
                                    "short"
                            }
                        ),

                file_name:
                    `hanami-photobooth-${Date.now()}.jpg`,

                photo_data:
                    attachment

            };


            Object.entries(
                fields
            ).forEach(
                (
                    [
                        name,
                        value
                    ]
                )=>{

                    const input=
                        document.createElement(
                            "input"
                        );


                    input.type=
                        "hidden";


                    input.name=
                        name;


                    input.value=
                        value;


                    form.appendChild(
                        input
                    );

                }
            );


            document.body.appendChild(
                form
            );


            let finished=
                false;


            const cleanup=()=>{

                form.remove();


                setTimeout(
                    ()=>{

                        iframe.remove();

                    },
                    300
                );

            };


            const success=()=>{

                if(
                    finished
                ){

                    return;

                }


                finished=
                    true;


                cleanup();


                resolve({
                    accepted:true
                });

            };


            const failure=()=>{

                if(
                    finished
                ){

                    return;

                }


                finished=
                    true;


                cleanup();


                reject(
                    new Error(
                        "Browser gagal mengirim permintaan ke Google Apps Script."
                    )
                );

            };


            iframe.addEventListener(
                "load",
                ()=>{

                    if(
                        !finished
                    ){

                        setTimeout(
                            success,
                            500
                        );

                    }

                }
            );


            try{

                form.submit();

            }catch(error){

                failure();

                return;

            }


            setTimeout(
                ()=>{

                    if(
                        !finished
                    ){

                        success();

                    }

                },
                3000
            );

        }
    );

}


/* =========================================================
   SEND EMAIL BUTTON
========================================================= */

sendEmailBtn.addEventListener(
    "click",
    async()=>{

        const email=
            emailInput.value.trim();


        if(
            !email
        ){

            setEmailStatus(
                "Silakan masukkan alamat email.",
                "error"
            );


            emailInput.focus();


            return;

        }


        if(
            !isValidEmail(
                email
            )
        ){

            setEmailStatus(
                "Format email tidak valid.",
                "error"
            );


            emailInput.focus();


            return;

        }


        if(
            !resultDataURL
        ){

            setEmailStatus(
                "Hasil foto belum tersedia.",
                "error"
            );


            return;

        }


        sendEmailBtn.disabled=
            true;


        sendEmailBtn.innerHTML=
            '<i class="fas fa-spinner fa-spin"></i> Mengirim...';


        setEmailStatus(
            "Sedang mengirim hasil foto...",
            "sending"
        );


        try{

            await sendResultByEmail(
                email
            );


            setEmailStatus(
                "✓ Permintaan pengiriman diterima. Cek inbox email kamu.",
                "success"
            );


            sendEmailBtn.innerHTML=
                '<i class="fas fa-check"></i> Terkirim';


            updateStatus(
                "Permintaan pengiriman foto diterima ✿"
            );


            setTimeout(
                ()=>{

                    emailPanel.classList.add(
                        "hidden"
                    );


                    emailInput.value=
                        "";


                    sendEmailBtn.disabled=
                        false;


                    sendEmailBtn.innerHTML=
                        '<i class="fas fa-paper-plane"></i> Kirim';

                },
                2200
            );


        }catch(error){

            console.error(
                "Google Apps Script email error:",
                error
            );


            setEmailStatus(
                `Gagal mengirim foto. ${
                    error?.message ||
                    "Periksa URL Google Apps Script dan deployment."
                }`,
                "error"
            );


            sendEmailBtn.disabled=
                false;


            sendEmailBtn.innerHTML=
                '<i class="fas fa-paper-plane"></i> Coba Lagi';

        }

    }
);


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearSession(
    message=
        "Template siap digunakan."
){

    captureSession++;


    captureInProgress=
        false;


    capturedImages=[];


    resultDataURL=
        null;


    captureOverlay.classList.remove(
        "show"
    );


    captureOverlay.textContent=
        "";


    startCaptureBtn.disabled=
        !stream;


    themeSelect.disabled=
        false;


    gridOptions.forEach(
        button=>{

            button.disabled=
                false;

        }
    );


    updateCaptureStatus();


    renderTemplatePreview();


    updateTemplateInfo();


    setEmailStatus(
        ""
    );


    emailInput.value=
        "";


    sendEmailBtn.disabled=
        false;


    sendEmailBtn.innerHTML=
        '<i class="fas fa-paper-plane"></i> Kirim';


    closeResultModal();


    closeSupportModal();


    updateStatus(
        message
    );

}


resetResultBtn.addEventListener(
    "click",
    ()=>{

        clearSession(
            "Photobooth telah di-reset. Silakan mulai sesi baru."
        );

    }
);


/* =========================================================
   PRINT
========================================================= */

printResultBtn.addEventListener(
    "click",
    ()=>{

        if(
            !resultDataURL
        ){

            return;

        }


        const printWindow=
            window.open(
                "",
                "_blank"
            );


        if(
            !printWindow
        ){

            alert(
                "Popup diblokir browser. Izinkan popup untuk mencetak."
            );


            return;

        }


        printWindow.document.write(`

            <!doctype html>

            <html>

            <head>

                <title>
                    Hanami Photo Studio
                </title>

                <style>

                    @page{
                        margin:0;
                    }

                    html,
                    body{

                        margin:0;

                        width:100%;

                        height:100%;

                        display:flex;

                        align-items:center;

                        justify-content:center;

                        background:#fff;

                    }

                    img{

                        max-width:100%;

                        max-height:100vh;

                    }

                </style>

            </head>

            <body>

                <img
                    src="${resultDataURL}"
                    onload="window.print()"
                >

            </body>

            </html>

        `);


        printWindow.document.close();

    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

createPetals();


applyLanguage(
    languageSelect.value
);


renderTemplatePreview();


updateTemplateInfo();


updateCaptureStatus();


startCaptureBtn.disabled=
    true;


initCamera();


window.addEventListener(
    "beforeunload",
    stopCamera
);

})();