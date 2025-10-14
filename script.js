const tg = window.Telegram.WebApp;
tg.ready();

// --- Get all our HTML elements ---
const form = document.getElementById('scraper-form');
// ... (rest of your getElementById lines are the same)
const submitButton = document.getElementById('submit-button');
const tabs = document.querySelectorAll('.tab');
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


// --- Initialize Tagify for the department input ---
var tagify = new Tagify(targetsInput);

// --- Form Validation & Button Disabling Logic ---
function validateForm() {
    // ... (this function is the same)
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

// ... (the event listeners are the same)
[locationInput, countInput, urlsInput].forEach(input => {
    input.addEventListener('input', validateForm);
});
tagify.on('add', validateForm).on('remove', validateForm);


// --- Tab and Visibility Logic ---
function updateFormVisibility() {
    // ... (this function is the same)
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

// ... (the tab click logic is the same)
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

updateFormVisibility();

// --- Final Form Submission Logic (WITH DEBUGGING ALERTS) ---
form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // --- CHECKPOINT 1 ---
    alert("Submit button clicked! The script is running.");

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

    // --- CHECKPOINT 2 ---
    alert("Data collected:\n" + JSON.stringify(data, null, 2));

    try {
        // --- CHECKPOINT 3 ---
        alert("About to send data to Telegram...");
        tg.sendData(JSON.stringify(data));
        tg.close();
    } catch (error) {
        // --- CHECKPOINT 4 (Error) ---
        alert("An error occurred trying to send data: " + error.message);
    }
});