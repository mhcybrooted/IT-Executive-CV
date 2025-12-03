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

    document.querySelectorAll('.section, .skill-item, .timeline-item').forEach(el => {
        observer.observe(el);
    });

    // Animated Statistics Logic
    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.stat-number');
                    counters.forEach(counter => {
                        const target = +counter.getAttribute('data-target');
                        const duration = 2000; // 2 seconds
                        const increment = target / (duration / 16); // 60fps

                        let current = 0;
                        const updateCounter = () => {
                            current += increment;
                            if (current < target) {
                                counter.innerText = Math.ceil(current);
                                requestAnimationFrame(updateCounter);
                            } else {
                                counter.innerText = target;
                            }
                        };
                        updateCounter();
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
        statsObserver.observe(statsSection);
    }

    // Back to Top Button Logic
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.ariaLabel = 'Back to Top';
    backToTopBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 15l-6-6-6 6"/>
        </svg>
    `;
    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Page Scroll Progress Bar Logic
    const progressContainer = document.createElement('div');
    progressContainer.className = 'scroll-progress-container';
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
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


    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            const formStatus = document.getElementById('form-status');

            // Show loading state
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            submitBtn.disabled = true;
            formStatus.style.display = 'none';

            try {
                const formData = new FormData(contactForm);
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Success
                    formStatus.textContent = '? Message sent successfully! I\'ll get back to you soon.';
                    formStatus.className = 'success';
                    formStatus.style.display = 'block';
                    contactForm.reset();
                } else {
                    // Error
                    formStatus.textContent = '? Oops! There was a problem sending your message. Please try again.';
                    formStatus.className = 'error';
                    formStatus.style.display = 'block';
                }
            } catch (error) {
                // Network error
                formStatus.textContent = '? Network error. Please check your connection and try again.';
                formStatus.className = 'error';
                formStatus.style.display = 'block';
            } finally {
                // Reset button state
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }
    // Search Functionality
    const searchPages = [
        { url: 'index.html', title: 'Home' },
        { url: 'skills.html', title: 'Skills' },
        { url: 'experience.html', title: 'Experience' },
        { url: 'specialized-systems.html', title: 'Specialized Systems' },
        { url: 'education.html', title: 'Education' },
        { url: 'case-studies.html', title: 'Case Studies' },
        { url: 'automation.html', title: 'Automation' },
        { url: 'projects.html', title: 'Projects' },
        { url: 'contact.html', title: 'Contact' }
    ];

    // Inject Search Modal
    const searchModalHTML = `
    <div id="search-modal" class="search-modal">
        <div class="search-content">
            <div class="search-header">
                <input type="text" id="search-input" placeholder="Search entire website..." autocomplete="off">
                <button id="close-search" aria-label="Close Search">&times;</button>
            </div>
            <div id="search-results" class="search-results"></div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', searchModalHTML);

    // Add Search Icon to Header
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const searchBtnHTML = `
        <button id="search-toggle" class="theme-toggle" aria-label="Open Search" style="margin-right: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </button>
        `;
        themeToggle.insertAdjacentHTML('beforebegin', searchBtnHTML);
    }

    // Search Logic
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const closeSearchBtn = document.getElementById('close-search');
    const searchToggleBtn = document.getElementById('search-toggle');

    let siteContent = [];
    let isContentFetched = false;

    const fallbackContent = [
        { url: 'index.html', title: 'Home', content: 'Mahmudul Hasan IT Executive Linux System Administrator Executive Summary Professional Profile' },
        { url: 'skills.html', title: 'Skills', content: 'Core Competencies Technical Mastery Linux Administration Networking Cybersecurity System Administration Arch Linux Kali Ubuntu CentOS Bash Docker' },
        { url: 'experience.html', title: 'Experience', content: 'Professional Experience SKYLINK Innovations NEXUS Netro Spy Security System Decodes Lab IT Executive System Administrator' },
        { url: 'specialized-systems.html', title: 'Specialized Systems', content: 'Specialized Systems ZKTeco Biometric Systems CCTV VMS Surveillance Security Hardware' },
        { url: 'education.html', title: 'Education', content: 'Education Diploma in Computer Technology Feni Computer Institute Personal Projects CEH Internship' },
        { url: 'case-studies.html', title: 'Case Studies', content: 'Case Studies Linux System Hardening Network Segmentation Surveillance System Integration' },
        { url: 'automation.html', title: 'Automation', content: 'Automation Bash Scripting Docker Containerization System Maintenance Log Rotation' },
        { url: 'projects.html', title: 'Projects', content: 'Projects GitHub Repositories Portfolio Open Source' },
        { url: 'contact.html', title: 'Contact', content: 'Contact Me Get in Touch Email Phone Location Formspree' }
    ];

    async function fetchSiteContent() {
        if (isContentFetched) return;

        searchResults.innerHTML = '<div class="search-result-item"><p>Indexing content...</p></div>';

        try {
            const promises = searchPages.map(async (page) => {
                const response = await fetch(page.url);
                if (!response.ok) throw new Error('Network response was not ok');
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const mainContent = doc.querySelector('main') || doc.body;
                const scripts = mainContent.querySelectorAll('script, style');
                scripts.forEach(s => s.remove());

                const text = mainContent.innerText.replace(/\s+/g, ' ').trim();
                return {
                    url: page.url,
                    title: page.title,
                    content: text
                };
            });

            siteContent = await Promise.all(promises);
            isContentFetched = true;
            searchResults.innerHTML = '';
            performSearch(searchInput.value);
        } catch (error) {
            console.warn('Fetch failed (likely local file access), using fallback index:', error);
            siteContent = fallbackContent;
            isContentFetched = true;
            searchResults.innerHTML = '';
            performSearch(searchInput.value);
        }
    }

    function performSearch(query) {
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results = siteContent.filter(page => {
            return page.title.toLowerCase().includes(lowerQuery) ||
                page.content.toLowerCase().includes(lowerQuery);
        });

        displayResults(results, lowerQuery);
    }

    function displayResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item"><p>No results found.</p></div>';
            return;
        }

        searchResults.innerHTML = results.map(result => {
            // Create a snippet
            const contentLower = result.content.toLowerCase();
            const index = contentLower.indexOf(query);
            let snippet = '';

            if (index > -1) {
                const start = Math.max(0, index - 50);
                const end = Math.min(result.content.length, index + 100);
                snippet = '...' + result.content.substring(start, end) + '...';
            } else {
                snippet = result.content.substring(0, 150) + '...';
            }

            return `
            <a href="${result.url}" class="search-result-item" onclick="closeSearch()">
                <h4>${result.title}</h4>
                <p>${snippet}</p>
            </a>
            `;
        }).join('');
    }

    function openSearch() {
        searchModal.classList.add('active');
        searchInput.focus();
        fetchSiteContent();
    }

    function closeSearch() {
        searchModal.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
    }

    window.closeSearch = closeSearch; // Make global for onclick

    if (searchToggleBtn) {
        searchToggleBtn.addEventListener('click', openSearch);
    }

    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', closeSearch);
    }

    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) closeSearch();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (isContentFetched) {
                performSearch(e.target.value);
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
            closeSearch();
        }
    });

});
