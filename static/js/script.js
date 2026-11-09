// The saved theme is applied by an inline script in <head> to avoid a flash.
const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-bs-theme', newTheme);
    sessionStorage.setItem('theme', newTheme);
};

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', toggleTheme);
    }
});
