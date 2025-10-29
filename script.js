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
const accordionHeaders = document.querySelectorAll('.accordion-header');

// --- Location Elements ---
const locationSection = document.getElementById('location-section');
const locationTypeSelect = document.getElementById('location-type-select');
const cityStateFields = document.getElementById('city-state-fields');
const stateOnlyField = document.getElementById('state-only-field');
const otherLocationField = document.getElementById('other-location-field');
const locationCityInput = document.getElementById('location-city');
const locationStateSelect = document.getElementById('location-state');
const locationStateOnlySelect = document.getElementById('location-state-only');
const locationOtherInput = document.getElementById('location-other');

// --- University Count Element ---
const universityCountSection = document.getElementById('university-count-section');
const countInput = document.getElementById('university-count');

// --- Targeting Elements ---
const targetingOptionsSection = document.getElementById('targeting-options-section');
const enableUniversityFilter = document.getElementById('enable-university-filter');
const universityFilterInput = document.getElementById('university-filter-input');
const universitiesInput = document.getElementById('universities');
const enableDepartmentFilter = document.getElementById('enable-department-filter');
const departmentFilterInput = document.getElementById('department-filter-input');
const targetsInput = document.getElementById('targets');

// --- URL Scrape Elements ---
const urlScrapeOptions = document.getElementById('url-scrape-options');
const urlsInput = document.getElementById('urls');

// --- Options Element ---
const optionsSection = document.getElementById('options-section');

// --- Initialize Tagify ---
var departmentTagify = new Tagify(targetsInput);
var universityTagify = new Tagify(universitiesInput);


// --- Form Validation Logic ---
function validateForm() {
    const currentMode = modeInput.value;
    let isValid = false;

    // --- Location Validation ---
    let locationValid = false;
    const locationType = locationTypeSelect.value;
    if (locationType === 'city') {
        locationValid = locationCityInput.value.trim() !== '' && locationStateSelect.value.trim() !== '';
    } else if (locationType === 'state') {
        locationValid = locationStateOnlySelect.value.trim() !== '';
    } else if (locationType === 'other') {
        locationValid = locationOtherInput.value.trim() !== '';
    }

    // --- Targeting Validation ---
    let targetingValid = true; // Valid by default
    if (currentMode === 'directory') {
        // If in directory mode, at least one filter must be enabled and filled
        const universityFilterOn = enableUniversityFilter.checked;
        const departmentFilterOn = enableDepartmentFilter.checked;
        
        if (!universityFilterOn && !departmentFilterOn) {
             // If neither is on, it's invalid (or you can change this to mean "all")
             // For now, let's require at least one.
             targetingValid = false; 
        }
        if (universityFilterOn && universityTagify.value.length === 0) {
            targetingValid = false; // Enabled but empty
        }
        if (departmentFilterOn && departmentTagify.value.length === 0) {
            targetingValid = false; // Enabled but empty
        }
    }
    
    // --- Final Validation Check ---
    if (currentMode === 'full') {
        isValid = locationValid && countInput.value.trim() !== '';
    } else if (currentMode === 'directory') {
        isValid = locationValid && countInput.value.trim() !== '' && targetingValid;
    } else if (currentMode === 'url') {
        isValid = urlsInput.value.trim() !== '';
    }
    
    submitButton.disabled = !isValid;
}

// --- Event Listeners ---
// Location inputs
[locationCityInput, locationOtherInput, countInput, urlsInput].forEach(input => {
    input.addEventListener('input', validateForm);
    input.addEventListener('paste', validateForm);
});
[locationTypeSelect, locationStateSelect, locationStateOnlySelect].forEach(select => {
    select.addEventListener('change', validateForm);
});
// Tagify inputs
departmentTagify.on('add', validateForm).on('remove', validateForm);
universityTagify.on('add', validateForm).on('remove', validateForm);
// Checkboxes
[enableUniversityFilter, enableDepartmentFilter].forEach(checkbox => {
    checkbox.addEventListener('change', validateForm);
});


// --- Dynamic Form Logic ---
// 1. Location Type Dropdown
locationTypeSelect.addEventListener('change', () => {
    cityStateFields.style.display = 'none';
    stateOnlyField.style.display = 'none';
    otherLocationField.style.display = 'none';
    
    const selectedType = locationTypeSelect.value;
    if (selectedType === 'city') {
        cityStateFields.style.display = 'flex';
    } else if (selectedType === 'state') {
        stateOnlyField.style.display = 'flex';
    } else if (selectedType === 'other') {
        otherLocationField.style.display = 'flex';
    }
    validateForm(); // Re-validate after changing layout
});

// 2. Targeting Checkboxes
enableUniversityFilter.addEventListener('change', () => {
    universityFilterInput.style.display = enableUniversityFilter.checked ? 'flex' : 'none';
    validateForm();
});
enableDepartmentFilter.addEventListener('change', () => {
    departmentFilterInput.style.display = enableDepartmentFilter.checked ? 'flex' : 'none';
    validateForm();
});


// --- Tab and Visibility Logic ---
function updateFormVisibility() {
    const currentMode = modeInput.value;

    // Hide all dynamic sections first
    locationSection.style.display = 'none';
    universityCountSection.style.display = 'none';
    targetingOptionsSection.style.display = 'none';
    urlScrapeOptions.style.display = 'none';
    optionsSection.style.display = 'none';

    // Show sections based on mode
    if (currentMode === 'full' || currentMode === 'directory') {
        locationSection.style.display = 'flex';
        universityCountSection.style.display = 'flex';
        optionsSection.style.display = 'flex';
    }
    
    if (currentMode === 'directory') {
        targetingOptionsSection.style.display = 'flex';
    } else if (currentMode === 'url') {
        urlScrapeOptions.style.display = 'flex';
    }
    
    // Trigger location dropdown logic to show the correct sub-fields
    locationTypeSelect.dispatchEvent(new Event('change'));
    
    validateForm();
}

// --- Segmented Control Click Logic ---
segments.forEach(segment => {
    segment.addEventListener('click', () => {
        segments.forEach(s => s.classList.remove('active'));
        segment.classList.add('active');

        // Update button text in HTML to "Targeted Scrape"
        if (segment.id === 'btn-full') {
            modeInput.value = 'full';
        } else if (segment.id === 'btn-directory') { // This ID matches your HTML
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

// --- Run on page load ---
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

        // Convert all checkboxes to booleans
        data.ignoreUsed = data.ignoreUsed === 'on';
        data.aiContactFilter = data.aiContactFilter === 'on';
        data.enableUniversityFilter = data.enableUniversityFilter === 'on';
        data.enableDepartmentFilter = data.enableDepartmentFilter === 'on';

        // Helper function to parse Tagify input
        const parseTagify = (tagString) => {
            if (tagString && typeof tagString === 'string') {
                try {
                    return JSON.parse(tagString).map(tag => tag.value);
                } catch (e) { return []; }
            }
            return [];
        };
        
        data.targets = parseTagify(data.targets);
        data.universities = parseTagify(data.universities);

        // Parse URLs from textarea
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