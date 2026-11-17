/* =========================================================
   ROETS KERSFEESONTBYT 2026 – FINALE INTERAKTIEWE JAVASCRIPT
   ========================================================= */

"use strict";

const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzPYztgq2JJbRP9YkfjQFUFfMfJ2SS8CKtSr3bqhTXsKLzBISWVIXswJLYv2-4lTGP6/exec";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const globe = $("#snowglobe");
const globeSnow = $("#globeSnow");
const revealButton = $("#revealInvitation");
const enableMotionButton = $("#enableMotion");
const globeInstruction = $("#globeInstruction");
const navigation = $("#sceneNavigation");
const footer = $(".site-footer");
const musicToggle = $("#musicToggle");
const musicLabel = $("#musicLabel");
const form = $("#rsvpForm");
const formStatus = $("#formStatus");
const submitButton = $("#submitButton");
const photoInput = $("#photos");
const photoNames = $("#photoNames");

const sceneOrder = ["snowglobeScene", "invitationScene", "detailsScene", "countdownScene", "rsvpScene", "wishesScene", "closingScene"];
const scenes = sceneOrder.map(id => document.getElementById(id)).filter(Boolean);
let currentScene = "snowglobeScene";
let invitationRevealed = false;
let revealTimer = null;

function showScene(sceneId) {
    const nextScene = document.getElementById(sceneId);
    if (!nextScene) return;

    scenes.forEach(scene => {
        scene.classList.remove("active");
        scene.hidden = true;
    });

    nextScene.hidden = false;
    void nextScene.offsetWidth;
    nextScene.classList.add("active");
    currentScene = sceneId;

    if (navigation) navigation.hidden = sceneId === "snowglobeScene";
    if (footer) footer.style.display = sceneId === "snowglobeScene" ? "none" : "";

    $$(".nav-dot").forEach(dot => {
        const active = dot.dataset.scene === sceneId;
        dot.classList.toggle("active", active);
        if (active) dot.setAttribute("aria-current", "step");
        else dot.removeAttribute("aria-current");
    });

    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

showScene("snowglobeScene");

$$('[data-next]').forEach(button => button.addEventListener("click", () => showScene(button.dataset.next)));
$$('.nav-dot').forEach(dot => dot.addEventListener("click", () => showScene(dot.dataset.scene)));

/* Sneeubol: sneeu bou geleidelik op met elke tik of foonbeweging. */
let snowBurstCount = 0;
let snowflakeCount = 0;
const MAX_GLOBE_FLAKES = 190;
let motionEnabled = false;
let previousMotion = null;
let lastShakeAt = 0;
function addGlobeSnow(amount = 28, burst = false) {
    if (!globeSnow) return;
    const available = Math.max(0, MAX_GLOBE_FLAKES - snowflakeCount);
    const count = Math.min(amount, available);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
        const flake = document.createElement("span");
        flake.className = "flake";
        flake.textContent = Math.random() > .62 ? "❄" : "•";
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.animationDuration = `${2.4 + Math.random() * 3.8}s`;
        flake.style.animationDelay = `${Math.random() * .7}s`;
        flake.style.fontSize = `${5 + Math.random() * (burst ? 13 : 9)}px`;
        if (burst) flake.classList.add("flake-burst");
        fragment.appendChild(flake);
    }

    globeSnow.appendChild(fragment);
    snowflakeCount += count;
    window.setTimeout(() => {
        const flakes = globeSnow.querySelectorAll(".flake");
        flakes.forEach(flake => {
            if (flake.getBoundingClientRect().bottom > globeSnow.getBoundingClientRect().bottom - 2) {
                flake.remove();
                snowflakeCount = Math.max(0, snowflakeCount - 1);
            }
        });
    }, 7200);
}

function initialiseGlobeSnow() {
    globeSnow?.replaceChildren();
    snowflakeCount = 0;
    snowBurstCount = 0;
    addGlobeSnow(38, false);
}
initialiseGlobeSnow();

function stirSnowGlobe() {
    if (invitationRevealed || currentScene !== "snowglobeScene") return;
    snowBurstCount += 1;
    addGlobeSnow(34 + snowBurstCount * 7, true);

    if (globe) {
        globe.classList.remove("shaking");
        void globe.offsetWidth;
        globe.classList.add("shaking");
        window.setTimeout(() => globe.classList.remove("shaking"), 850);
    }

    if (globeInstruction) {
        const remaining = Math.max(0, 3 - snowBurstCount);
        globeInstruction.textContent = remaining > 0
            ? `Nog ${remaining} ${remaining === 1 ? "keer" : "kere"} ... die sneeu-magie bou op!`
            : "Die sneeu dwarrel ... jou uitnodiging word onthul!";
    }
    playSoftChime();
    if (snowBurstCount >= 3) revealInvitation();
}

function revealInvitation() {
    if (invitationRevealed) return;
    invitationRevealed = true;
    if (revealButton) revealButton.hidden = true;
    if (enableMotionButton) enableMotionButton.hidden = true;
    if (globeInstruction) globeInstruction.textContent = "Die Kersfees-magie word onthul ...";
    addGlobeSnow(55, true);
    globe?.classList.add("shaking");
    playMagicSound();
    clearTimeout(revealTimer);
    revealTimer = window.setTimeout(() => showScene("invitationScene"), 2100);
}

// Elke tik voeg nuwe sneeu by. Drie tikke/skudbewegings onthul die uitnodiging.
if (globe) globe.addEventListener("click", stirSnowGlobe);
if (revealButton) revealButton.addEventListener("click", revealInvitation);

/* Bewegingsensor: toestemming word eers ná 'n duidelike gebruikerhandeling gevra. */
async function enableMotionSensor() {
    if (motionEnabled) {
        if (globeInstruction) globeInstruction.textContent = "Skud jou foon drie keer om die sneeu-magie te laat opbou.";
        return;
    }
    if (!("DeviceMotionEvent" in window)) {
        if (globeInstruction) globeInstruction.textContent = "Jou toestel ondersteun nie foonbewegings nie. Tik drie keer op die sneeubol of gebruik die ontdekknoppie.";
        return;
    }
    try {
        if (typeof DeviceMotionEvent.requestPermission === "function") {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission !== "granted") throw new Error("Bewegingstoestemming is nie toegestaan nie.");
        }
        window.addEventListener("devicemotion", detectPhoneShake, { passive: true });
        motionEnabled = true;
        if (enableMotionButton) {
            enableMotionButton.setAttribute("aria-pressed", "true");
            enableMotionButton.textContent = "Skudfunksie geaktiveer";
        }
        if (globeInstruction) globeInstruction.textContent = "Skud jou foon drie keer — elke skud voeg meer sneeu by!";
    } catch (error) {
        console.info("Bewegingsensor nie geaktiveer nie:", error.message);
        if (globeInstruction) globeInstruction.textContent = "Geen probleem nie — tik drie keer op die sneeubol of gebruik die ontdekknoppie.";
    }
}

function detectPhoneShake(event) {
    if (invitationRevealed || currentScene !== "snowglobeScene") return;
    const acceleration = event.acceleration;
    const gravity = event.accelerationIncludingGravity;
    let strength = 0;
    if (acceleration && [acceleration.x, acceleration.y, acceleration.z].some(Number.isFinite)) {
        strength = Math.hypot(acceleration.x || 0, acceleration.y || 0, acceleration.z || 0);
    } else if (gravity && [gravity.x, gravity.y, gravity.z].some(Number.isFinite)) {
        const current = { x: gravity.x || 0, y: gravity.y || 0, z: gravity.z || 0 };
        if (previousMotion) strength = Math.hypot(current.x - previousMotion.x, current.y - previousMotion.y, current.z - previousMotion.z);
        previousMotion = current;
    }
    const now = Date.now();
    if (strength > 12 && now - lastShakeAt > 650) {
        lastShakeAt = now;
        stirSnowGlobe();
    }
}
if (enableMotionButton) enableMotionButton.addEventListener("click", enableMotionSensor);

/* Sagte, oorspronklike klankeffekte. Geen eksterne musiek word gespeel nie. */
let audioContext = null;
let chimeInterval = null;
let soundEnabled = false;

function getAudioContext() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!audioContext) audioContext = new AudioCtor();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
}

function playTone(frequency, delay = 0, duration = 1.25, volume = .035) {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .06);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .05);
}

function playMagicSound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => playTone(frequency, index * .13, 1.45, .04));
}

function playSoftChime() {
    if (!soundEnabled) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 880];
    playTone(notes[Math.floor(Math.random() * notes.length)], 0, 1.1, .018);
}

if (musicToggle) {
    musicToggle.addEventListener("click", async () => {
        try {
            getAudioContext();
            soundEnabled = !soundEnabled;
            musicToggle.setAttribute("aria-pressed", String(soundEnabled));
            if (musicLabel) musicLabel.textContent = soundEnabled ? "Klankeffekte aan" : "Klankeffekte af";
            if (soundEnabled) {
                playSoftChime();
                chimeInterval = window.setInterval(playSoftChime, 6500);
            } else {
                clearInterval(chimeInterval);
            }
        } catch (error) {
            soundEnabled = false;
            if (musicLabel) musicLabel.textContent = "Klank nie beskikbaar nie";
            console.warn("Klank kon nie begin nie:", error);
        }
    });
}

/* Aftelling na 25 Desember 2026 om 09:00 Suid-Afrikaanse plaaslike tyd. */
const christmasDate = new Date(2026, 11, 25, 9, 0, 0).getTime();
function updateCountdown() {
    const ids = ["days", "hours", "minutes", "seconds"];
    const nodes = ids.map(id => document.getElementById(id));
    if (nodes.some(node => !node)) return;
    let remaining = christmasDate - Date.now();
    const message = $("#countdownMessage");
    if (remaining <= 0) {
        nodes.forEach(node => node.textContent = "00");
        if (message) message.textContent = "Vandag is Kersfees! Ons hoop jy geniet elke oomblik.";
        return;
    }
    const days = Math.floor(remaining / 86400000); remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000); remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000); remaining %= 60000;
    const seconds = Math.floor(remaining / 1000);
    [days, hours, minutes, seconds].forEach((value, index) => nodes[index].textContent = String(value).padStart(2, "0"));
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

/* Meerstap-RSVP-vorm */
const formSteps = $$(".form-step");
let currentFormStep = 1;
const totalFormSteps = formSteps.length;

function showFormStep(stepNumber) {
    currentFormStep = Math.min(Math.max(stepNumber, 1), totalFormSteps);
    formSteps.forEach(step => {
        const active = Number(step.dataset.step) === currentFormStep;
        step.hidden = !active;
        step.classList.toggle("active", active);
    });
    const heading = $(`.form-step[data-step="${currentFormStep}"] h3`);
    if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
    }
}

function validateCurrentStep() {
    const step = $(`.form-step[data-step="${currentFormStep}"]`);
    if (!step) return true;
    for (const field of step.querySelectorAll("[required]")) {
        if (!field.checkValidity()) {
            field.reportValidity();
            field.focus();
            return false;
        }
    }
    return true;
}

$$('[data-form-next]').forEach(button => button.addEventListener("click", () => {
    if (validateCurrentStep() && currentFormStep < totalFormSteps) showFormStep(currentFormStep + 1);
}));
$$('[data-form-back]').forEach(button => button.addEventListener("click", () => {
    if (currentFormStep > 1) showFormStep(currentFormStep - 1);
}));
if (formSteps.length) showFormStep(1);

/* Foto-validasie en omskakeling */
if (photoInput) {
    photoInput.addEventListener("change", () => {
        const files = Array.from(photoInput.files || []);
        if (photoNames) photoNames.textContent = "";
        let error = "";
        if (files.length > 3) error = "Jy kan 'n maksimum van drie foto's oplaai.";
        else if (files.some(file => file.size > 5 * 1024 * 1024)) error = "Elke foto moet kleiner as 5 MB wees.";
        else if (files.some(file => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))) error = "Gebruik asseblief JPG-, PNG-, WEBP- of GIF-foto's.";
        if (error) {
            photoInput.value = "";
            if (photoNames) photoNames.textContent = error;
        } else if (files.length && photoNames) {
            photoNames.textContent = files.map(file => file.name).join(" · ");
        }
    });
}

function readPhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, mimeType: file.type, data: String(reader.result).split(",")[1] });
        reader.onerror = () => reject(new Error(`Die foto ${file.name} kon nie gelees word nie.`));
        reader.readAsDataURL(file);
    });
}

if (form) {
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (formStatus) {
            formStatus.className = "form-status";
            formStatus.textContent = "";
        }
        if (!validateCurrentStep()) return;

        const files = Array.from(photoInput?.files || []);
        const consent = $("#photoConsent")?.checked === true;
        if (files.length && !consent) {
            if (formStatus) {
                formStatus.classList.add("error");
                formStatus.textContent = "Bevestig asseblief dat jy toestemming het om die foto's te deel.";
            }
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Besig om jou RSVP te stuur ...";
        }

        try {
            const photos = await Promise.all(files.map(readPhoto));
            const payload = Object.fromEntries(new FormData(form).entries());
            delete payload.photos;
            delete payload.photoConsent;
            payload.attendees = Number(payload.attendees);
            payload.photos = photos;
            payload.photoConsent = consent;

            // text/plain voorkom 'n CORS preflight. Google Apps Script kan steeds
            // 'n netwerk-/CORS-fout gee; in daardie geval word geen sukses belowe nie.
            const response = await fetch(RSVP_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
                redirect: "follow"
            });
            if (!response.ok) throw new Error("Die RSVP-diens kon nie bereik word nie.");
            const result = await response.json();
            if (!result.success) throw new Error(result.message || "Jou RSVP kon nie gestoor word nie.");

            if (formStatus) {
                formStatus.classList.add("success");
                formStatus.textContent = "Baie dankie! Jou RSVP is suksesvol ontvang. Ons sien baie uit daarna om saam Kersfees te vier.";
            }
            form.reset();
            if (photoNames) photoNames.textContent = "";
            showFormStep(1);
        } catch (error) {
            console.error("RSVP-fout:", error);
            if (formStatus) {
                formStatus.classList.add("error");
                formStatus.textContent = "Jou RSVP kon nie bevestig word nie. Kontroleer jou internetverbinding en probeer weer. Indien die probleem voortduur, kontak ons asseblief per WhatsApp. Jou inskrywing is nie as suksesvol bevestig nie.";
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Stuur my RSVP <span>✧</span>';
            }
        }
    });
}

/* Herbegin die ervaring */
const restartButton = $("#restartExperience");
if (restartButton) restartButton.addEventListener("click", () => {
    invitationRevealed = false;
    clearTimeout(revealTimer);
    if (globe) globe.classList.remove("shaking");
    if (revealButton) revealButton.hidden = false;
    if (enableMotionButton) enableMotionButton.hidden = false;
    if (enableMotionButton && motionEnabled) {
        enableMotionButton.setAttribute("aria-pressed", "true");
        enableMotionButton.textContent = "Skudfunksie geaktiveer";
    }
    if (globeInstruction) globeInstruction.textContent = "Skud jou foon drie keer of tik drie keer op die sneeubol.";
    initialiseGlobeSnow();
    showScene("snowglobeScene");
});

/* Klein sprankel wanneer die agtergrond aangeraak word. */
document.addEventListener("click", event => {
    if (event.target.closest("button, a, input, textarea, label")) return;
    const sparkle = document.createElement("span");
    sparkle.textContent = "✦";
    Object.assign(sparkle.style, {
        position: "fixed", left: `${event.clientX}px`, top: `${event.clientY}px`,
        color: "#e4c987", fontSize: "17px", pointerEvents: "none", zIndex: "999",
        animation: "sparkleDisappear 1s ease forwards"
    });
    document.body.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 1000);
});

const sparkleStyle = document.createElement("style");
sparkleStyle.textContent = `@keyframes sparkleDisappear { 0% { opacity: 1; transform: scale(.5) translateY(0); } 100% { opacity: 0; transform: scale(1.8) translateY(-20px); } }`;
document.head.appendChild(sparkleStyle);

console.info("Roets Kersfeesontbyt 2026: interaktiewe ervaring gelaai.");
