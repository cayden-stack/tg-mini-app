const N8N_WEBHOOK_URL = 'https://primary-production-f30d.up.railway.app/webhook/245f13ae-4567-4aa6-aa19-d9f96f89352a';
const tg = window.Telegram.WebApp;
tg.ready();

// --- Get all our HTML elements ---
const form = document.getElementById('scraper-form');
const feedback = document.getElementById('feedback');
const submitButton = document.getElementById('submit-button');
const tabs = document.querySelectorAll('.tab');
const modeInput = document.getElementById('mode-input');
const locationOptions = document.getElementById('location-options');
const targetedScrapeOptions = document.getElementById('targeted-scrape-options');
const urlScrapeOptions = document.getElementById('url-scrape-options');
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

    if (currentMode === 'full' || currentMode === 'directory') {
        if (locationInput.value.trim() !== '' && countInput.value.trim() !== '') {
            isValid = true;
        }
    } else if (currentMode === 'url') {
        if (urlsInput.value.trim() !== '') {
            isValid = true;
        }
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

    locationOptions.style.display = 'none';
    targetedScrapeOptions.style.display = 'none';
    urlScrapeOptions.style.display = 'none';

    if (currentMode === 'full' || currentMode === 'directory') {
        locationOptions.style.display = 'flex';
    }
    if (currentMode === 'directory') {
        targetedScrapeOptions.style.display = 'flex';
    } else if (currentMode === 'url') {
        urlScrapeOptions.style.display = 'flex';
    }

    validateForm(); // Re-validate the form whenever the mode changes
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
    submitButton.disabled = true; // Disable button on submit
    feedback.textContent = 'Sending data to ALFRED...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.ignoreUsed = data.ignoreUsed === 'on';

    // Get the values from Tagify. It returns an array of objects.
    // We'll convert it to a simple array of strings.
    if (data.targets) {
        try {
            data.targets = JSON.parse(data.targets).map(tag => tag.value);
        } catch (e) {
            data.targets = []; // Handle case where input is not valid JSON
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
            // New: Better Error Feedback
            const errorData = await response.json();
            feedback.textContent = `Error: ${errorData.message || 'Unknown error. Please try again.'}`;
            submitButton.disabled = false; // Re-enable button on error
        }
    } catch (error) {
        feedback.textContent = 'Network error. Please check your connection.';
        submitButton.disabled = false; // Re-enable button on error
    }
});