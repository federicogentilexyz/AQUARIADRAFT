document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MENU ATTIVO, FRECCIA E HAMBURGER
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-menu a');
    const arrow = document.querySelector('.menu-arrow');
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.getElementById('hamburger-menu');
    let currentPath = window.location.pathname.split('/').pop();
    
    if (currentPath === '' || currentPath === 'index.html') currentPath = 'index.html'; 

    let activeLink = null;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            activeLink = link;
        }
    });

    function moveArrowTo(element) {
        if (!element || !arrow || window.innerWidth <= 768) {
            if(arrow) arrow.classList.remove('show');
            return;
        }
        const linkRect = element.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        const topPosition = linkRect.top - sidebarRect.top + (linkRect.height / 2);
        arrow.style.top = `${topPosition}px`;
        arrow.classList.add('show');
    }

    if (activeLink) setTimeout(() => moveArrowTo(activeLink), 50);

    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() { moveArrowTo(this); });
    });

    if(sidebar) {
        sidebar.addEventListener('mouseleave', function() {
            moveArrowTo(activeLink);
        });
    }

    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            sidebar.classList.toggle('open');
        });
    }

    // ==========================================
    // 2. FUNZIONI DI UTILITÀ
    // ==========================================
    function getDirectImageUrl(url) {
        if (!url) return '';
        let cleanUrl = url.trim();
        
        if (cleanUrl.includes('dropbox.com')) return cleanUrl.replace('?dl=0', '?raw=1').replace('?dl=1', '?raw=1');

        if (cleanUrl.includes('drive.google.com')) {
            const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            const openMatch = cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
            let fileId = driveMatch ? driveMatch[1] : (openMatch ? openMatch[1] : null);
            if (fileId) return `https://drive.google.com/uc?id=${fileId}`;
        }
        return cleanUrl;
    }

    function parseCSV(text) {
        let lines = []; let line = []; let curr = ''; let inQuotes = false;
        for(let i=0; i<text.length; i++) {
            let char = text[i];
            if (char === '"') {
                if (inQuotes && text[i+1] === '"') { curr += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                line.push(curr.trim()); curr = '';
            } else if (char === '\n' && !inQuotes) {
                line.push(curr.trim()); lines.push(line); line = []; curr = '';
            } else if (char !== '\r') {
                curr += char;
            }
        }
        line.push(curr.trim()); lines.push(line);
        return lines;
    }

    // ==========================================
    // 3. LOGICA HOMEPAGE
    // ==========================================
    const homeGallery = document.getElementById('home-gallery');
    if (homeGallery) {
        const SHEET_ID_HOME = '1KyYkhsmas5Zgqznv9216sDXjvKdSGKrRfB75GJbysrc'; 
        const urlHome = `https://docs.google.com/spreadsheets/d/${SHEET_ID_HOME}/gviz/tq?tqx=out:csv`;

        fetch(urlHome)
            .then(res => res.text())
            .then(csvText => {
                homeGallery.innerHTML = '';
                const rows = parseCSV(csvText);
                rows.forEach((data, index) => {
                    if (index === 0 || !data[0]) return;
                    
                    const imageUrl = getDirectImageUrl(data[0]);
                    const targetPage = (data[1] || '#').trim();
                    const dateText = (data[2] || '').trim();
                    const artistText = (data[3] || '').trim();

                    if (imageUrl) {
                        const linkEl = document.createElement('a');
                        linkEl.href = targetPage;
                        linkEl.className = 'gallery-link';
                        
                        linkEl.innerHTML = `
                            <img src="${imageUrl}" alt="Evento">
                            <div class="gallery-overlay">
                                ${dateText ? `<span class="g-date">${dateText}</span>` : ''}
                                ${artistText ? `<span class="g-artist">${artistText}</span>` : ''}
                            </div>
                        `;
                        homeGallery.appendChild(linkEl);
                    }
                });
            });
    }

    // ==========================================
    // 4. LOGICA EVENTI (Art & Hub)
    // ==========================================
    const eventsContainer = document.getElementById('events-container');
    if (eventsContainer) {
        let SHEET_ID = '';
        let TAB_NAME = '';

        if (currentPath === 'art-events.html') {
            SHEET_ID = '1_Tv5lTTCD8g6jFKB5aOUnN1yklCbzPcZgU0zcLzKX2w';
            TAB_NAME = 'Art_Events';
        } else if (currentPath === 'hub-events.html') {
            SHEET_ID = '139s2vPitxXyqubkfUPQrlse6ZoQbbe7CiPaFpE2jpZ8';
            TAB_NAME = 'Hub_Events';
        }

        if (SHEET_ID) {
            const urlEvents = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${TAB_NAME}`;
            fetch(urlEvents)
                .then(res => res.text())
                .then(csvText => {
                    eventsContainer.innerHTML = '';
                    const rows = parseCSV(csvText);
                    for (let i = 1; i < rows.length; i++) {
                        const data = rows[i];
                        if (!data[0]) continue;

                        const imageUrl = getDirectImageUrl(data[4]);
                        const article = document.createElement('article');
                        article.className = 'event-item';
                        article.innerHTML = `
                            <div class="event-header">
                                <div class="e-date">${data[0].replace(/\n/g, '<br>')}</div>
                                <div class="e-title">${data[1].toUpperCase()}<br>“${data[2]}”</div>
                                <div class="e-loc">${(data[6] || '').replace(/\n/g, '<br>')}</div>
                            </div>
                            <div class="event-details">
                                <div class="e-desc">
                                    <p>${(data[3] || '').replace(/\n/g, '<br>')}</p>
                                    ${data[5] ? `<a href="${data[5]}" target="_blank" class="buy-tickets">Aquista i biglietti</a>` : ''}
                                </div>
                                <div class="e-image">
                                    ${imageUrl ? `<img src="${imageUrl}" alt="Evento">` : ''}
                                </div>
                            </div>`;
                        
                        article.querySelector('.event-header').addEventListener('click', () => {
                            document.querySelectorAll('.event-item').forEach(el => { if(el !== article) el.classList.remove('open'); });
                            article.classList.toggle('open');
                        });
                        eventsContainer.appendChild(article);
                    }
                });
        }
    }

    // ==========================================
    // 5. LOGICA ARTISTS
    // ==========================================
    const artistsContainer = document.getElementById('artists-container');
    if (artistsContainer) {
        // INSERISCI QUI L'ID DEL TUO NUOVO GOOGLE SHEET DEGLI ARTISTI:
        const SHEET_ID_ARTISTS = '1ivpWB8Pe8iO902BvbB5u5IGoFkA5TXI2xcbu7Of5dG0'; 
        const urlArtists = `https://docs.google.com/spreadsheets/d/${SHEET_ID_ARTISTS}/gviz/tq?tqx=out:csv`;

        fetch(urlArtists)
            .then(res => res.text())
            .then(csvText => {
                artistsContainer.innerHTML = '';
                const rows = parseCSV(csvText);
                for (let i = 1; i < rows.length; i++) {
                    const data = rows[i];
                    if (!data[0]) continue; // Salta righe vuote

                    const article = document.createElement('article');
                    article.className = 'event-item'; // Ricicliamo la classe per usare l'effetto fisarmonica
                    article.innerHTML = `
                        <div class="artist-header">
                            <div class="a-name">${data[0]}</div>
                            <div class="a-category">${data[1] || ''}</div>
                            <div class="a-date">${data[2] || ''}</div>
                        </div>
                        <div class="event-details">
                            <div class="a-desc">
                                <p>${(data[3] || '').replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>`;
                    
                    article.querySelector('.artist-header').addEventListener('click', () => {
                        document.querySelectorAll('.event-item').forEach(el => { if(el !== article) el.classList.remove('open'); });
                        article.classList.toggle('open');
                    });
                    artistsContainer.appendChild(article);
                }
            })
            .catch(err => {
                artistsContainer.innerHTML = '<p style="padding: 30px;">Incolla l\'ID del foglio Google nello script.js per visualizzare gli artisti.</p>';
            });
    }
});
