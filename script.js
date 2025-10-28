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
const urlsInput = document.getElementById('urls');
const accordionHeaders = document.querySelectorAll('.accordion-header');

// --- Initialize Tagify (ONLY for departments) ---
var tagify = new Tagify(targetsInput);

// --- Form Validation Logic (Unchanged) ---
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
        isValid = urlsInput.value.trim() !== '';
    }
    
    submitButton.disabled = !isValid;
}

// --- Event Listeners (Unchanged) ---
[locationInput, countInput, urlsInput].forEach(input => {
    input.addEventListener('input', validateForm);
    input.addEventListener('paste', validateForm);
});
tagify.on('add', validateForm).on('remove', validateForm);


// --- Tab and Visibility Logic (THIS PART IS FIXED) ---
function updateFormVisibility() {
    const currentMode = modeInput.value;

    // First, hide all optional sections
    locationSection.style.display = 'none';
    universityCountSection.style.display = 'none';
    directoryScrapeOptions.style.display = 'none';
    urlScrapeOptions.style.display = 'none';
    optionsSection.style.display = 'none';

    // --- THIS IS THE FIX ---
    // Set all inputs to NOT be required by default
    locationInput.required = false;
    countInput.required = false;
    // (Tagify handles its own validation, so 'targets' is fine)
    urlsInput.required = false;
    // --- END OF FIX ---

    // Now, show sections AND set 'required' for visible fields
    if (currentMode === 'full' || currentMode === 'directory') {
        locationSection.style.display = 'flex';
        universityCountSection.style.display = 'flex';
        optionsSection.style.display = 'flex';
        
        locationInput.required = true;
        countInput.required = true;
    }
    
    if (currentMode === 'directory') {
        directoryScrapeOptions.style.display = 'flex';
        // 'targets' (Tagify) validation is handled in validateForm()
    } else if (currentMode === 'url') {
        urlScrapeOptions.style.display = 'flex';
        urlsInput.required = true;
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

// --- Final Form Submission Logic (Unchanged) ---
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

        if (data.targets && typeof data.targets === 'string') {
            try {
                data.targets = JSON.parse(data.targets).map(tag => tag.value);
            } catch (e) {
                data.targets = [];
            }
        } else {
            data.targets = [];
        }

        if (data.urls && typeof data.urls === 'string') {
            data.urls = data.urls.split('\n')
                                 .map(url => url.trim())
                                 .filter(url => url.length > 0);
        } else {
            data.urls = [];
        }

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