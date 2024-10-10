// Function to toggle the theme and save it to session storage
const toggleTheme = () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-bs-theme', newTheme);
    sessionStorage.setItem('theme', newTheme);
};

// Add event listener to the theme switcher button
document.getElementById('theme-switcher').addEventListener('click', toggleTheme);

// Check session storage for saved theme on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = sessionStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-bs-theme', savedTheme);
});