
/* =========================================================
   ROETS KERSFEESONTBYT 2026
   INTERAKTIEWE JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. GOOGLE APPS SCRIPT VERBINDING
   ========================================================= */

const RSVP_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzPYztgq2JJbRP9YkfjQFUFfMfJ2SS8CKtSr3bqhTXsKLzBISWVIXswJLYv2-4lTGP6/exec";


/* =========================================================
   2. ALGEMENE VERWYSINGS
   ========================================================= */

const globe = document.getElementById("snowglobe");
const globeSnow = document.getElementById("globeSnow");

const revealButton = document.getElementById("revealInvitation");
const globeInstruction = document.getElementById("globeInstruction");

const navigation = document.getElementById("sceneNavigation");
const footer = document.querySelector(".site-footer");

const musicToggle = document.getElementById("musicToggle");
const musicLabel = document.getElementById("musicLabel");

const form = document.getElementById("rsvpForm");
const formStatus = document.getElementById("formStatus");
const submitButton = document.getElementById("submitButton");


/* =========================================================
   3. TONEELBESTUUR
   ========================================================= */

const sceneOrder = [
    "snowglobeScene",
    "invitationScene",
    "detailsScene",
    "countdownScene",
    "rsvpScene",
    "wishesScene",
    "closingScene"
];

let currentScene = "snowglobeScene";

const scenes = sceneOrder.map(id =>
    document.getElementById(id)
);


function showScene(sceneId) {

    const nextScene = document.getElementById(sceneId);

    if (!nextScene) return;

    scenes.forEach(scene => {

        scene.classList.remove("active");
        scene.hidden = true;

    });

    nextScene.hidden = false;

    // Heraktiveer animasie.
    void nextScene.offsetWidth;

    nextScene.classList.add("active");

    currentScene = sceneId;

    // Navigasie verskyn eers nadat die sneeubol oopgemaak is.
    navigation.hidden = sceneId === "snowglobeScene";

    // Voetskrif verskyn ook eers ná die onthulling.
    footer.style.display =
        sceneId === "snowglobeScene" ? "none" : "";

    updateNavigation(sceneId);

    // Begin elke nuwe toneel boaan.
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function updateNavigation(sceneId) {

    document.querySelectorAll(".nav-dot").forEach(dot => {

        dot.classList.toggle(
            "active",
            dot.dataset.scene === sceneId
        );

    });

}


/* Aanvanklike toestand */

showScene("snowglobeScene");


/* Vervolgknoppies */

document.querySelectorAll("[data-next]").forEach(button => {

    button.addEventListener("click", () => {

        showScene(button.dataset.next);

    });

});


/* Navigasiepunte */

document.querySelectorAll(".nav-dot").forEach(dot => {

    dot.addEventListener("click", () => {

        showScene(dot.dataset.scene);

    });

});


/* =========================================================
   4. SNEEUBOL EN MAGIESE ONTHULLING
   ========================================================= */

let invitationRevealed = false;
let lastShake = 0;


function createGlobeSnow(amount = 60) {

    globeSnow.innerHTML = "";

    for (let i = 0; i < amount; i++) {

        const flake = document.createElement("span");

        flake.className = "flake";

        flake.textContent =
            Math.random() > 0.5 ? "❄" : "•";

        flake.style.left =
            `${Math.random() * 100}%`;

        flake.style.animationDuration =
            `${2.5 + Math.random() * 3.5}s`;

        flake.style.animationDelay =
            `${Math.random() * 1.5}s`;

        flake.style.fontSize =
            `${5 + Math.random() * 10}px`;

        globeSnow.appendChild(flake);

    }

}


function triggerGlobeShake() {

    if (invitationRevealed) return;

    invitationRevealed = true;

    // Voeg meer sneeu by.
    createGlobeSnow(100);

    // Laat die sneeubol bewe.
    globe.classList.remove("shaking");

    void globe.offsetWidth;

    globe.classList.add("shaking");

    // Verander die instruksie.
    globeInstruction.textContent =
        "Die Kersfees-magie word onthul ...";

    // Verberg die ekstra knoppie.
    revealButton.style.display = "none";

    // Begin die klank-effek.
    playMagicSound();

    // Gee die sneeubol tyd om te bewe voordat die uitnodiging verskyn.
    setTimeout(() => {

        showScene("invitationScene");

    }, 1400);

}


/* Klik op die sneeubol */

globe.addEventListener("click", () => {

    triggerGlobeShake();

});


/* Alternatiewe onthulknoppie */

revealButton.addEventListener("click", () => {

    triggerGlobeShake();

});


/* Aanvanklike sneeu */

createGlobeSnow(35);


/* =========================================================
   5. FOONSENSOR: SKUD DIE SNEEUBOL
   ========================================================= */

let motionPermissionRequested = false;
let motionListenerAdded = false;


function detectPhoneShake(event) {

    if (invitationRevealed) return;

    const acceleration = event.accelerationIncludingGravity;

    if (!acceleration) return;

    const x = Math.abs(acceleration.x || 0);
    const y = Math.abs(acceleration.y || 0);
    const z = Math.abs(acceleration.z || 0);

    const movementStrength = x + y + z;

    const now = Date.now();

    // Vermy dat klein bewegings die uitnodiging aktiveer.
    if (
        movementStrength > 32 &&
        now - lastShake > 1500
    ) {

        lastShake = now;

        triggerGlobeShake();

    }

}


async function enableMotionSensor() {

    if (!("DeviceMotionEvent" in window)) {
        return;
    }

    if (motionListenerAdded) return;

    try {

        // Sommige iPhones vereis uitdruklike toestemming.
        if (
            typeof DeviceMotionEvent.requestPermission === "function"
        ) {

            if (motionPermissionRequested) return;

            motionPermissionRequested = true;

            const permission =
                await DeviceMotionEvent.requestPermission();

            if (permission !== "granted") {
                return;
            }

        }

        window.addEventListener(
            "devicemotion",
            detectPhoneShake
        );

        motionListenerAdded = true;

    } catch (error) {

        console.warn(
            "Bewegingsensor kon nie geaktiveer word nie:",
            error
        );

    }

}


/*
   Die eerste aanraking op die sneeubol is ook 'n gebruikerhandeling.
   Dit laat ons toe om bewegingsensor-toestemming aan te vra waar nodig.
*/

globe.addEventListener("pointerdown", () => {

    enableMotionSensor();

}, { once: true });


/* =========================================================
   6. MAGIESE KLANK
   ========================================================= */

let audioContext = null;


function playMagicSound() {

    try {

        if (!audioContext) {

            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const frequencies = [
            523.25,
            659.25,
            783.99,
            1046.50
        ];

        frequencies.forEach((frequency, index) => {

            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();

            oscillator.type = "sine";

            oscillator.frequency.value = frequency;

            const startTime =
                audioContext.currentTime + index * 0.12;

            gain.gain.setValueAtTime(
                0.0001,
                startTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.045,
                startTime + 0.05
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                startTime + 1.5
            );

            oscillator.connect(gain);

            gain.connect(audioContext.destination);

            oscillator.start(startTime);

            oscillator.stop(startTime + 1.6);

        });

    } catch (error) {

        console.warn("Klank kon nie gespeel word nie:", error);

    }

}


/* =========================================================
   7. AGTERGRONDKLANKBEHEER
   ========================================================= */

let musicEnabled = false;
let musicInterval = null;


function playSoftChime() {

    if (!musicEnabled || !audioContext) return;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    const notes = [
        523.25,
        659.25,
        783.99,
        587.33
    ];

    const note =
        notes[Math.floor(Math.random() * notes.length)];

    oscillator.type = "sine";

    oscillator.frequency.value = note;

    gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.025,
        audioContext.currentTime + 0.05
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 1.3
    );

    oscillator.connect(gain);

    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(audioContext.currentTime + 1.4);

}


musicToggle.addEventListener("click", async () => {

    try {

        if (!audioContext) {

            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        musicEnabled = !musicEnabled;

        musicToggle.setAttribute(
            "aria-pressed",
            String(musicEnabled)
        );

        if (musicEnabled) {

            musicLabel.textContent = "Klank aan";

            playSoftChime();

            musicInterval = setInterval(
                playSoftChime,
                4200
            );

        } else {

            musicLabel.textContent = "Klank af";

            clearInterval(musicInterval);

        }

    } catch (error) {

        console.warn("Klankbeheer kon nie begin nie:", error);

    }

});


/* =========================================================
   8. KERSFEESAFTELLING
   ========================================================= */

// 25 Desember 2026 om 09:00, plaaslike tyd.

const christmasDate =
    new Date(2026, 11, 25, 9, 0, 0).getTime();


function updateCountdown() {

    const now = Date.now();

    let difference = christmasDate - now;

    const message =
        document.getElementById("countdownMessage");

    if (difference <= 0) {

        document.getElementById("days").textContent = "00";
        document.getElementById("hours").textContent = "00";
        document.getElementById("minutes").textContent = "00";
        document.getElementById("seconds").textContent = "00";

        message.textContent =
            "Vandag is Kersfees! Ons hoop jy geniet elke oomblik.";

        return;

    }

    const days = Math.floor(
        difference / (1000 * 60 * 60 * 24)
    );

    difference %= 1000 * 60 * 60 * 24;

    const hours = Math.floor(
        difference / (1000 * 60 * 60)
    );

    difference %= 1000 * 60 * 60;

    const minutes = Math.floor(
        difference / (1000 * 60)
    );

    difference %= 1000 * 60;

    const seconds = Math.floor(
        difference / 1000
    );


    document.getElementById("days").textContent =
        String(days).padStart(2, "0");

    document.getElementById("hours").textContent =
        String(hours).padStart(2, "0");

    document.getElementById("minutes").textContent =
        String(minutes).padStart(2, "0");

    document.getElementById("seconds").textContent =
        String(seconds).padStart(2, "0");

}


updateCountdown();

setInterval(updateCountdown, 1000);


/* =========================================================
   9. RSVP: DRIE-STAP VORM
   ========================================================= */

const formSteps =
    document.querySelectorAll(".form-step");

let currentFormStep = 1;

const totalFormSteps = formSteps.length;


function showFormStep(stepNumber) {

    currentFormStep = stepNumber;

    formSteps.forEach(step => {

        const isActive =
            Number(step.dataset.step) === stepNumber;

        step.hidden = !isActive;

        step.classList.toggle(
            "active",
            isActive
        );

    });

    // Plaas die fokus by die opskrif van die nuwe stap.
    const heading = document.querySelector(
        `.form-step[data-step="${stepNumber}"] h3`
    );

    if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
    }

}


function validateCurrentStep() {

    const currentStep = document.querySelector(
        `.form-step[data-step="${currentFormStep}"]`
    );

    const requiredFields =
        currentStep.querySelectorAll("[required]");

    for (const field of requiredFields) {

        if (!field.checkValidity()) {

            field.reportValidity();

            return false;

        }

    }

    return true;

}


/* Volgende stap */

document.querySelectorAll("[data-form-next]").forEach(button => {

    button.addEventListener("click", () => {

        if (!validateCurrentStep()) return;

        if (currentFormStep < totalFormSteps) {

            showFormStep(currentFormStep + 1);

        }

    });

});


/* Vorige stap */

document.querySelectorAll("[data-form-back]").forEach(button => {

    button.addEventListener("click", () => {

        if (currentFormStep > 1) {

            showFormStep(currentFormStep - 1);

        }

    });

});


/* Begin by die eerste stap */

showFormStep(1);


/* =========================================================
   10. RSVP: FOTO-OPLAAI
   ========================================================= */

const photoInput =
    document.getElementById("photos");

const photoNames =
    document.getElementById("photoNames");


photoInput.addEventListener("change", () => {

    const files = Array.from(photoInput.files);

    photoNames.textContent = "";

    if (files.length > 3) {

        photoInput.value = "";

        photoNames.textContent =
            "Jy kan 'n maksimum van drie foto's oplaai.";

        return;

    }

    const tooLarge = files.find(file =>
        file.size > 5 * 1024 * 1024
    );

    if (tooLarge) {

        photoInput.value = "";

        photoNames.textContent =
            "Elke foto moet kleiner as 5 MB wees.";

        return;

    }

    const invalidFile = files.find(file =>
        !file.type.startsWith("image/")
    );

    if (invalidFile) {

        photoInput.value = "";

        photoNames.textContent =
            "Laai asseblief slegs beeldlêers op.";

        return;

    }

    if (files.length > 0) {

        photoNames.textContent =
            files.map(file => file.name).join(" · ");

    }

});


/* =========================================================
   11. RSVP: FOTO'S NA BASE64
   ========================================================= */

function readPhoto(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            const base64Data =
                String(reader.result).split(",")[1];

            resolve({

                name: file.name,
                mimeType: file.type,
                data: base64Data

            });

        };

        reader.onerror = () => {

            reject(
                new Error("Een van die foto's kon nie gelees word nie.")
            );

        };

        reader.readAsDataURL(file);

    });

}


/* =========================================================
   12. RSVP: STUUR NA GOOGLE APPS SCRIPT
   ========================================================= */

form.addEventListener("submit", async event => {

    event.preventDefault();

    formStatus.className = "form-status";
    formStatus.textContent = "";


    // Maak seker dat die laaste vormstap geldig is.
    if (!validateCurrentStep()) return;


    const files =
        Array.from(photoInput.files);

    const photoConsent =
        document.getElementById("photoConsent").checked;


    // Foto's mag slegs gestuur word met toestemming.
    if (files.length > 0 && !photoConsent) {

        formStatus.classList.add("error");

        formStatus.textContent =
            "Bevestig asseblief dat jy toestemming het om die foto's te deel.";

        return;

    }


    submitButton.disabled = true;

    submitButton.textContent =
        "Besig om te stuur ...";


    try {

        // Lees die foto's.
        const photos = await Promise.all(
            files.map(readPhoto)
        );


        // Versamel al die teksantwoorde.
        const payload =
            Object.fromEntries(
                new FormData(form).entries()
            );


        // Verwyder die oorspronklike FileList.
        delete payload.photos;

        delete payload.photoConsent;


        // Voeg die foto's en toestemming by.
        payload.photos = photos;

        payload.photoConsent = photoConsent;


        /*
           Die versoek gebruik text/plain om 'n
           onnodige CORS-preflight te vermy.
        */

        const response = await fetch(
            RSVP_ENDPOINT,
            {

                method: "POST",

                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },

                body: JSON.stringify(payload)

            }
        );


        if (!response.ok) {

            throw new Error(
                "Die RSVP-diens kon nie bereik word nie."
            );

        }


        const result = await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Jou RSVP kon nie gestoor word nie."
            );

        }


        // Suksesboodskap.
        formStatus.classList.add("success");

        formStatus.textContent =
            "Baie dankie! Jou RSVP is suksesvol ontvang. Ons sien baie uit daarna om saam Kersfees te vier.";


        // Maak die vorm skoon.
        form.reset();

        photoNames.textContent = "";

        showFormStep(1);


    } catch (error) {

        console.error("RSVP-fout:", error);

        formStatus.classList.add("error");

        formStatus.textContent =
            "Jou RSVP kon nie bevestig word nie. Probeer asseblief weer of kontak ons per WhatsApp.";


    } finally {

        submitButton.disabled = false;

        submitButton.innerHTML =
            'Stuur my RSVP <span>✧</span>';

    }

});


/* =========================================================
   13. TERUG NA DIE BEGIN
   ========================================================= */

const restartButton =
    document.getElementById("restartExperience");


restartButton.addEventListener("click", () => {

    invitationRevealed = false;

    createGlobeSnow(35);

    globe.classList.remove("shaking");

    globeInstruction.textContent =
        "Skud jou foon of raak aan die sneeubol";

    revealButton.style.display = "inline-block";

    showScene("snowglobeScene");

});


/* =========================================================
   14. KLEIN AANRAKINGSEFFEK
   ========================================================= */

document.addEventListener("click", event => {

    if (
        event.target.closest("button") ||
        event.target.closest("a")
    ) {
        return;
    }

    const sparkle =
        document.createElement("span");

    sparkle.textContent = "✦";

    sparkle.style.position = "fixed";
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;

    sparkle.style.color = "#e4c987";
    sparkle.style.fontSize = "17px";

    sparkle.style.pointerEvents = "none";
    sparkle.style.zIndex = "999";

    sparkle.style.animation =
        "sparkleDisappear 1s ease forwards";

    document.body.appendChild(sparkle);

    setTimeout(() => {
        sparkle.remove();
    }, 1000);

});


/* Voeg die aanrakingsanimasiestyl by. */

const sparkleStyle =
    document.createElement("style");

sparkleStyle.textContent = `
    @keyframes sparkleDisappear {
        0% {
            opacity: 1;
            transform: scale(0.5) translateY(0);
        }

        100% {
            opacity: 0;
            transform: scale(1.8) translateY(-20px);
        }
    }
`;

document.head.appendChild(sparkleStyle);


/* =========================================================
   15. KONSOLEBEVESTIGING
   ========================================================= */

console.log(
    "❄ Roets Kersfeesontbyt 2026 is gereed!"
);

console.log(
    "Die sneeubol, tonele, aftelling en RSVP-funksies is gelaai."
);
