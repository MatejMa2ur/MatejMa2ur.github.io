// Function to toggle the theme and save it to session storage
const toggleTheme = () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-bs-theme', newTheme);
    sessionStorage.setItem('theme', newTheme);
};

// Function to apply the saved theme on page load
const applySavedTheme = () => {
    const savedTheme = sessionStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-bs-theme', savedTheme);
};

// Add event listener to the theme switcher button if it exists
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();

    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', toggleTheme);
    }
});