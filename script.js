// This should be the webhook URL from your Pipedream workflow
const PIPEDREAM_WEBHOOK_URL = 'https://eo9iczuzcub5ams.m.pipedream.net';

// This mock object is for local testing. It won't run inside Telegram.
if (window.Telegram === undefined) {
  window.Telegram = {
    WebApp: {
      ready: () => console.log("Telegram WebApp mock: Ready"),
      initDataUnsafe: { user: { id: 123, first_name: "Test User" } },
      close: () => console.log("Telegram WebApp mock: Close")
    }
  };
}

const tg = window.Telegram.WebApp;
tg.ready();

// --- Get all our HTML elements ---
const form = document.getElementById('scraper-form');
const submitButton = document.getElementById('submit-button');
const segments = document.querySelectorAll('.segment');
const modeInput = document.getElementById('mode-input');
const locationSection = document.getElementById('location-section');
const universityCountSection = document.getElementById('university-count-section');
const directoryScrapeOptions = document.getElementById('directory-scrape-options');
const urlScrapeOptions = document.getElementById('url-scrape-options');
const optionsSection = document.getElementById('options-section');
const locationInput = document.getElementById('location');
const countInput = document.getElementById('university-count');
const targetsInput = document.getElementById('targets');
const urlsInput = document.getElementById('urls'); // This is now an <input>
const accordionHeaders = document.querySelectorAll('.accordion-header');

// --- Initialize Tagify ---
var tagify = new Tagify(targetsInput);
var tagifyUrls = new Tagify(urlsInput); // <-- FIX #1: Initialize Tagify for the URL input

// --- Form Validation Logic ---
function validateForm() {
    const currentMode = modeInput.value;
    let isValid = false;

    if (currentMode === 'full') {
        isValid = locationInput.value.trim() !== '' && countInput.value.trim() !== '';
    } else if (currentMode === 'directory') {
        const hasCommon = locationInput.value.trim() !== '' && countInput.value.trim() !== '';
        const hasTags = tagify.value && tagify.value.length > 0;
        isValid = hasCommon && hasTags;
    } else if (currentMode === 'url') {
        isValid = tagifyUrls.value.length > 0; // <-- FIX #2: Check the Tagify value
    }
    
    submitButton.disabled = !isValid;
}

// --- FIX #3: Update Event Listeners ---
// Removed urlsInput from this list
[locationInput, countInput].forEach(input => {
    input.addEventListener('input', validateForm);
    input.addEventListener('paste', validateForm);
});
// Add listeners for both Tagify instances
tagify.on('add', validateForm).on('remove', validateForm);
tagifyUrls.on('add', validateForm).on('remove', validateForm);
// --- END OF FIX #3 ---


// --- Tab and Visibility Logic (Unchanged) ---
function updateFormVisibility() {
    const currentMode = modeInput.value;

    locationSection.style.display = 'none';
    universityCountSection.style.display = 'none';
    directoryScrapeOptions.style.display = 'none';
    urlScrapeOptions.style.display = 'none';
    optionsSection.style.display = 'none';

    if (currentMode === 'full' || currentMode === 'directory') {
        locationSection.style.display = 'flex';
        universityCountSection.style.display = 'flex';
        optionsSection.style.display = 'flex';
    }
    
    if (currentMode === 'directory') {
        directoryScrapeOptions.style.display = 'flex';
    } else if (currentMode === 'url') {
        urlScrapeOptions.style.display = 'flex';
    }

    validateForm();
}

// --- Segmented Control Click Logic (Unchanged) ---
segments.forEach(segment => {
    segment.addEventListener('click', () => {
        segments.forEach(s => s.classList.remove('active'));
        segment.classList.add('active');

        if (segment.id === 'btn-full') {
            modeInput.value = 'full';
        } else if (segment.id === 'btn-directory') {
            modeInput.value = 'directory';
        } else if (segment.id === 'btn-url') {
            modeInput.value = 'url';
        }
        updateFormVisibility();
    });
});

// --- Accordion Click Logic (Unchanged) ---
accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        header.classList.toggle('active');
        const content = header.nextElementSibling;
        const chevron = header.querySelector('.chevron');

        if (content.style.display === "flex") {
            content.style.display = "none";
            if (chevron) chevron.textContent = '>';
        } else {
            content.style.display = "flex";
            if (chevron) chevron.textContent = 'v';
        }
    });
});

// --- Run on page load (Unchanged) ---
updateFormVisibility();

// --- Final Form Submission Logic ---
form.addEventListener('submit', async function(event) {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            data.user = tg.initDataUnsafe.user;
        } else {
            data.user = { id: 0, first_name: "Web User" };
        }

        data.ignoreUsed = data.ignoreUsed === 'on';
        data.aiContactFilter = data.aiContactFilter === 'on';

        // Parse 'targets' (departments)
        if (data.targets && typeof data.targets === 'string') {
            try {
                data.targets = JSON.parse(data.targets).map(tag => tag.value);
            } catch (e) {
                data.targets = [];
            }
        } else {
            data.targets = [];
        }

        // --- FIX #4: Parse 'urls' from the new Tagify input ---
        if (data.urls && typeof data.urls === 'string') {
            try {
                data.urls = JSON.parse(data.urls).map(tag => tag.value);
            } catch (e) {
                data.urls = [];
            }
        } else {
            data.urls = [];
        }
        // --- END OF FIX #4 ---

        const response = await fetch(PIPEDREAM_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            tg.close();
        } else {
            const errorData = await response.json();
            submitButton.disabled = false;
            submitButton.textContent = 'Start Scrape';
            feedback.textContent = `Error: ${errorData.message || 'Submission failed.'}`;
        }
    } catch (error) { 
        feedback.textContent = `A script error occurred: ${error.message}`;
        submitButton.disabled = false;
        submitButton.textContent = 'Start Scrape';
    }
});