// This is the webhook URL from your n8n "Webhook" trigger node
const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL_HERE';

// Initialize the Telegram Mini App
const tg = window.Telegram.WebApp;
tg.ready();

const form = document.getElementById('scraper-form');
const feedback = document.getElementById('feedback');

form.addEventListener('submit', async function(event) {
    // Prevent the form from doing a normal page refresh
    event.preventDefault();

    // Show a "loading" message
    feedback.textContent = 'Sending data to ALFRED...';

    // Get the data from the form
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        // Send the data to your n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            // If successful, show a success message and close the Mini App
            feedback.textContent = 'Success! ALFRED is on the job.';
            setTimeout(() => {
                tg.close();
            }, 1500); // Wait 1.5 seconds before closing
        } else {
            feedback.textContent = 'Error sending data. Please try again.';
        }
    } catch (error) {
        feedback.textContent = 'Network error. Please check your connection.';
    }
});