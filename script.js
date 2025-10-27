// This should be the webhook URL from your Pipedream workflow
const PIPEDREAM_WEBHOOK_URL = 'https://eo9iczuzcub5ams.m.pipedream.net';

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

// --- Initialize Tagify ---
var tagify = new Tagify(targetsInput);

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
        isValid = urlsInput.value.trim() !== '';
    }
    
    submitButton.disabled = !isValid;
}

[locationInput, countInput, urlsInput].forEach(input => {
    input.addEventListener('input', validateForm);
});
tagify.on('add', validateForm).on('remove', validateForm);


// --- Tab and Visibility Logic ---
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

// --- Segmented Control Click Logic ---
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

// --- Accordion Click Logic ---
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

// --- Run on page load ---
updateFormVisibility();

// --- Final Form Submission Logic ---
form.addEventListener('submit', async function(event) {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.user = tg.initDataUnsafe.user;

    // Convert all checkbox values to true/false
    data.ignoreUsed = data.ignoreUsed === 'on';
    data.aiContactFilter = data.aiContactFilter === 'on';

    if (data.targets) {
        try {
            data.targets = JSON.parse(data.targets).map(tag => tag.value);
        } catch (e) {
            data.targets = [];
        }
    }

    try {
        const response = await fetch(PIPEDREAM_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            // Success
        } else {
            const errorData = await response.json();
            submitButton.disabled = false;
            submitButton.textContent = 'Start Scrape';
        }
    } catch (error) {
        submitButton.disabled = false;
        submitButton.textContent = 'Start Scrape';
    }
});