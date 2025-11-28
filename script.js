document.addEventListener('DOMContentLoaded', () => {
    console.log('CV Website Loaded');

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check for saved user preference, if any, on load of the website
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });

    function createProjectCard(repo) {
        const article = document.createElement('article');
        article.className = 'project-card fade-in-up';

        // Generate a random gradient for the placeholder image based on repo name length
        const hue = (repo.name.length * 10) % 360;
        const gradient = `linear-gradient(135deg, hsl(${hue}, 60%, 50%), hsl(${hue + 40}, 60%, 30%))`;

        article.innerHTML = `
            <div class="project-image">
                <div class="placeholder-img" style="background: ${gradient};"></div>
            </div>
            <div class="project-info">
                <h3>${formatRepoName(repo.name)}</h3>
                <p>${repo.description || 'No description available.'}</p>
                <div class="tech-stack">
                    ${repo.language ? `<span>${repo.language}</span>` : ''}
                    <span>⭐ ${repo.stargazers_count}</span>
                </div>
                <div class="project-links">
                    <button class="btn-text view-details-btn" data-repo="${repo.name}">View Details</button>
                    <a href="${repo.html_url}" target="_blank">GitHub</a>
                </div>
            </div>
        `;

        // Add event listener for the View Details button
        const detailsBtn = article.querySelector('.view-details-btn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click if we add one later
                openProjectModal(repo);
            });
        }

        return article;
    }

    // Modal Logic
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');

    if (closeModal) {
        closeModal.onclick = function () {
            modal.style.display = "none";
        }
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    async function openProjectModal(repo) {
        if (!modal) return;

        modal.style.display = "block";
        modalBody.innerHTML = '<div class="loading-spinner">Loading Details...</div>';

        try {
            // Fetch README content
            const readmeResponse = await fetch(`https://api.github.com/repos/mhcybrooted/${repo.name}/readme`);

            let content = `<h2>${formatRepoName(repo.name)}</h2>`;
            content += `<p>${repo.description || ''}</p>`;
            content += `<div class="tech-stack" style="margin-bottom: 20px;">
                            ${repo.language ? `<span>${repo.language}</span>` : ''}
                            <span>⭐ ${repo.stargazers_count}</span>
                            <span>🍴 ${repo.forks_count}</span>
                        </div>`;

            if (readmeResponse.ok) {
                const readmeData = await readmeResponse.json();
                // Decode Base64 content (GitHub API returns base64)
                const decodedContent = atob(readmeData.content);
                // Simple markdown to HTML conversion (very basic)
                // For a real app, use a library like marked.js. Here we just show text.
                // We'll just show the first 500 characters to avoid messiness without a parser
                const previewText = decodedContent.substring(0, 1000).replace(/\n/g, '<br>');

                content += `<div class="readme-preview">
                                <h3>README Preview</h3>
                                <p style="font-family: monospace; font-size: 0.9rem;">${previewText}...</p>
                            </div>`;
            } else {
                content += `<p>No README found for this repository.</p>`;
            }

            content += `<div style="margin-top: 20px;">
                            <a href="${repo.html_url}" target="_blank" class="btn btn-primary">View on GitHub</a>
                        </div>`;

            modalBody.innerHTML = content;

        } catch (error) {
            console.error('Error fetching details:', error);
            modalBody.innerHTML = '<p class="error-msg">Failed to load details.</p>';
        }
    }

    function formatRepoName(name) {
        return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Fetch GitHub Projects
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        fetchGitHubProjects();
    }

    async function fetchGitHubProjects() {
        try {
            const response = await fetch('https://api.github.com/users/mhcybrooted/repos?sort=updated&per_page=100');

            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }

            const repos = await response.json();

            // Clear loading spinner
            projectsGrid.innerHTML = '';

            // Filter out forked repos and sort by stars
            const filteredRepos = repos
                .filter(repo => !repo.fork)
                .sort((a, b) => b.stargazers_count - a.stargazers_count);

            if (filteredRepos.length === 0) {
                projectsGrid.innerHTML = '<p class="error-msg">No projects found.</p>';
                return;
            }

            // Create project cards
            filteredRepos.forEach(repo => {
                const card = createProjectCard(repo);
                projectsGrid.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching GitHub projects:', error);
            projectsGrid.innerHTML = '<p class="error-msg">Failed to load projects. Please try again later.</p>';
        }
    }
});
