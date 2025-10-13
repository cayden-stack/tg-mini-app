const N8N_WEBHOOK_URL = 'https://primary-production-f30d.up.railway.app/webhook-test/245f13ae-4567-4aa6-aa19-d9f96f89352a';
const tg = window.Telegram.WebApp;
tg.ready();

// --- Get all our HTML elements ---
const form = document.getElementById('scraper-form');
const feedback = document.getElementById('feedback');
const submitButton = document.getElementById('submit-button');
const tabs = document.querySelectorAll('.tab');
const modeInput = document.getElementById('mode-input');
const locationSection = document.getElementById('location-section');
const universityCountSection = document.getElementById('university-count-section');
const directoryScrapeOptions = document.getElementById('directory-scrape-options');
const urlScrapeOptions = document.getElementById('url-scrape-options');
const optionsSection = document.getElementById('options-section'); // <-- New line
const locationInput = document.getElementById('location');
const countInput = document.getElementById('university-count');
const targetsInput = document.getElementById('targets');
const urlsInput = document.getElementById('urls');

// --- Initialize Tagify for the department input ---
var tagify = new Tagify(targetsInput);

// --- Form Validation & Button Disabling Logic ---
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

// Add event listeners to all inputs to re-validate on any change
[locationInput, countInput, urlsInput].forEach(input => {
    input.addEventListener('input', validateForm);
});
tagify.on('add', validateForm).on('remove', validateForm);


// --- Tab and Visibility Logic ---
function updateFormVisibility() {
    const currentMode = modeInput.value;

    // First, hide all optional sections
    locationSection.style.display = 'none';
    universityCountSection.style.display = 'none';
    directoryScrapeOptions.style.display = 'none';
    urlScrapeOptions.style.display = 'none';
    optionsSection.style.display = 'none'; // <-- New line

    // Then, show only the sections we need for the current mode
    if (currentMode === 'full' || currentMode === 'directory') {
        locationSection.style.display = 'flex';
        universityCountSection.style.display = 'flex';
        optionsSection.style.display = 'flex'; // <-- New line
    }
    
    if (currentMode === 'directory') {
        directoryScrapeOptions.style.display = 'flex';
    } else if (currentMode === 'url') {
        urlScrapeOptions.style.display = 'flex';
    }

    validateForm();
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const modeMap = {
            'tab-full': 'full',
            'tab-directory': 'directory',
            'tab-url': 'url'
        };
        modeInput.value = modeMap[tab.id];

        updateFormVisibility();
    });
});

// --- Run on page load ---
updateFormVisibility();


// --- Final Form Submission Logic ---
form.addEventListener('submit', async function(event) {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...'; // <-- ADD THIS LINE
    feedback.textContent = 'Sending data to ALFRED...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.ignoreUsed = data.ignoreUsed === 'on';

    if (data.targets) {
        try {
            data.targets = JSON.parse(data.targets).map(tag => tag.value);
        } catch (e) {
            data.targets = [];
        }
    }

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            feedback.textContent = 'Success! ALFRED is on the job.';
            setTimeout(() => tg.close(), 1500);
        } else {
            const errorData = await response.json();
            feedback.textContent = `Error: ${errorData.message || 'Unknown error. Please try again.'}`;
            submitButton.disabled = false;
        }
    } catch (error) {
        feedback.textContent = 'Network error. Please check your connection.';
        submitButton.disabled = false;
    }
});