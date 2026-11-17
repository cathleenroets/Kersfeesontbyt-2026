// Voeg die gepubliseerde Google Apps Script-webprogram-URL hier in nadat jy die opstelling voltooi het.
const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzPYztgq2JJbRP9YkfjQFUFfMfJ2SS8CKtSr3bqhTXsKLzBISWVIXswJLYv2-4lTGP6/exec";

const globe = document.getElementById("snowGlobe");
const snowLayer = document.getElementById("globeSnow");
const caption = document.getElementById("globeCaption");
let lastShake = 0;

function makeSnow(count = 45) {
  snowLayer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const flake = document.createElement("span");
    flake.className = "flake";
    flake.textContent = Math.random() > .5 ? "❄" : "•";
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDuration = `${2.4 + Math.random() * 3.8}s`;
    flake.style.animationDelay = `${Math.random() * 1.8}s`;
    flake.style.fontSize = `${5 + Math.random() * 9}px`;
    snowLayer.appendChild(flake);
  }
  caption.textContent = "Laat die Kersfees-magie sneeu";
}
globe.addEventListener("click", () => {
  makeSnow(65);
  globe.animate([{transform:"rotate(0)"},{transform:"rotate(-5deg)"},{transform:"rotate(5deg)"},{transform:"rotate(0)"}],{duration:550});
});
makeSnow(30);

// Bewegingsensor: werk net waar die blaaier toestemming en bewegingsdata toelaat.
if ("DeviceMotionEvent" in window) {
  window.addEventListener("devicemotion", event => {
    const a = event.accelerationIncludingGravity;
    if (!a) return;
    const strength = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
    const now = Date.now();
    if (strength > 32 && now - lastShake > 1600) {
      lastShake = now;
      makeSnow(75);
    }
  });
}

// Aftelling na 25 Desember 2026 om 09:00 (plaaslike tyd).
function updateCountdown() {
  const target = new Date(2026, 11, 25, 9, 0, 0).getTime();
  let diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86400000); diff %= 86400000;
  const hours = Math.floor(diff / 3600000); diff %= 3600000;
  const minutes = Math.floor(diff / 60000); diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = String(hours).padStart(2,"0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2,"0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2,"0");
}
updateCountdown(); setInterval(updateCountdown, 1000);

// Sagte oorspronklike, eenvoudige klokagtige klank word eers ná 'n klik gespeel.
let audioContext = null, soundOn = false, soundTimer = null;
const soundButton = document.getElementById("soundToggle");
const soundLabel = document.getElementById("soundLabel");
function chime() {
  if (!soundOn || !audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine"; osc.frequency.value = [523.25,659.25,783.99][Math.floor(Math.random()*3)];
  gain.gain.setValueAtTime(.0001,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.035,audioContext.currentTime+.04);
  gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+1.2);
  osc.connect(gain); gain.connect(audioContext.destination);
  osc.start(); osc.stop(audioContext.currentTime+1.25);
}
soundButton.addEventListener("click", async () => {
  if (!soundOn) {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") await audioContext.resume();
    soundOn = true; soundLabel.textContent = "Klank aan"; soundButton.setAttribute("aria-pressed","true");
    chime(); soundTimer = setInterval(chime, 4200);
  } else {
    soundOn = false; soundLabel.textContent = "Klank af"; soundButton.setAttribute("aria-pressed","false");
    clearInterval(soundTimer);
  }
});

const photoInput = document.getElementById("photos");
const photoNames = document.getElementById("photoNames");
photoInput.addEventListener("change", () => {
  const files = [...photoInput.files];
  if (files.length > 3) {
    photoInput.value = ""; photoNames.textContent = "Kies asseblief nie meer as drie foto’s nie."; return;
  }
  const tooLarge = files.find(file => file.size > 5 * 1024 * 1024);
  if (tooLarge) {
    photoInput.value = ""; photoNames.textContent = "Elke foto moet kleiner as 5 MB wees."; return;
  }
  photoNames.textContent = files.length ? files.map(f => f.name).join(" · ") : "";
});

const form = document.getElementById("rsvpForm");
const statusBox = document.getElementById("formStatus");
const submitButton = document.getElementById("submitButton");
form.addEventListener("submit", async event => {
  event.preventDefault();
  statusBox.className = "form-status";
  if (RSVP_ENDPOINT.startsWith("PLAK_")) {
    statusBox.classList.add("error");
    statusBox.textContent = "Die RSVP-vorm is ontwerp, maar die privaat Google-verbinding moet nog opgestel word. Volg die INSTALLASIE-lêer om dit te aktiveer.";
    return;
  }
  const files = [...photoInput.files];
  if (files.length && !document.getElementById("photoConsent").checked) {
    statusBox.classList.add("error"); statusBox.textContent = "Bevestig asseblief dat jy toestemming het om die foto’s te deel."; return;
  }
  submitButton.disabled = true; submitButton.textContent = "Besig om te stuur ...";
  try {
    const photos = await Promise.all(files.map(file => new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({name:file.name,mimeType:file.type,data:String(reader.result).split(",")[1]});
      reader.onerror = reject; reader.readAsDataURL(file);
    })));
    const payload = Object.fromEntries(new FormData(form).entries());
    delete payload.photos; delete payload.photoConsent;
    payload.photoConsent = document.getElementById("photoConsent").checked;
    payload.photos = photos;
    const response = await fetch(RSVP_ENDPOINT,{method:"POST",body:JSON.stringify(payload),headers:{"Content-Type":"text/plain;charset=utf-8"}});
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Kon nie jou RSVP stoor nie.");
    statusBox.classList.add("success");
    statusBox.textContent = "Dankie! Jou RSVP is ontvang. Ons sien baie uit daarna om saam Kersfees te vier.";
    form.reset(); photoNames.textContent = "";
  } catch (error) {
    statusBox.classList.add("error"); statusBox.textContent = error.message || "Iets het verkeerd geloop. Probeer asseblief weer of kontak ons per WhatsApp.";
  } finally {
    submitButton.disabled = false; submitButton.innerHTML = 'Stuur my RSVP <span>→</span>';
  }
});
