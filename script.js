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
        if (link.getAttribute('href') === currentPath || link.getAttribute('href').includes(currentPath)) {
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
                    
                    const dateText = (data[2] || '').trim().replace(/\n/g, '<br>');
                    const artistText = (data[3] || '').trim().replace(/\n/g, '<br>');

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
            })
            .catch(err => console.error("Errore galleria home:", err));
    }

    // ==========================================
    // 4. LOGICA EVENTI (Exhibitions & Hub)
    // ==========================================
    const eventsContainer = document.getElementById('events-container');
    if (eventsContainer) {
        let SHEET_ID = '';
        let TAB_NAME = '';
        
        const currentPageUrl = window.location.href.toLowerCase();

        if (currentPageUrl.includes('exhibitions') || currentPageUrl.includes('art-events')) {
            SHEET_ID = '1_Tv5lTTCD8g6jFKB5aOUnN1yklCbzPcZgU0zcLzKX2w';
            TAB_NAME = 'Art_Events';
        } else if (currentPageUrl.includes('hub-events')) {
            SHEET_ID = '139s2vPitxXyqubkfUPQrlse6ZoQbbe7CiPaFpE2jpZ8';
            TAB_NAME = 'Hub_Events';
        }

        if (SHEET_ID) {
            eventsContainer.innerHTML = '<p style="padding: 30px; font-family: var(--font-serif);">Caricamento eventi...</p>';

            const urlEvents = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${TAB_NAME}`;
            
            fetch(urlEvents)
                .then(res => res.text())
                .then(csvText => {
                    eventsContainer.innerHTML = '';
                    const rows = parseCSV(csvText);
                    
                    for (let i = 1; i < rows.length; i++) {
                        const data = rows[i];
                        if (!data[0]) continue; 

                        const eDate = data[0] ? data[0].replace(/\n/g, '<br>') : '';
                        const eTitleName = data[1] ? data[1].toUpperCase().replace(/\n/g, '<br>') : '';
                        const eTitleSub = data[2] ? data[2].replace(/\n/g, '<br>') : '';
                        const eDesc = data[3] ? data[3].replace(/\n/g, '<br>') : '';
                        const imageUrl = getDirectImageUrl(data[4]);
                        const ticketsLink = data[5] || '';
                        const eLoc = data[6] ? data[6].replace(/\n/g, '<br>') : '';

                        const article = document.createElement('article');
                        article.className = 'event-item';
                        article.id = 'evento-' + i; 

                        article.innerHTML = `
                            <div class="event-header">
                                <div class="e-date">${eDate}</div>
                                <div class="e-title">${eTitleName}<br>“${eTitleSub}”</div>
                                <div class="e-loc">${eLoc}</div>
                            </div>
                            <div class="event-details">
                                <div class="e-desc">
                                    <p>${eDesc}</p>
                                    ${ticketsLink ? `<a href="${ticketsLink}" target="_blank" class="buy-tickets">Acquista i biglietti</a>` : ''}
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

                    // FUNZIONE MAGICA CORAZZATA (Anti-ritardo da server reale)
                    if (window.location.hash) {
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                const hashId = window.location.hash.substring(1); 
                                const targetEvent = document.getElementById(hashId);
                                
                                if (targetEvent) {
                                    targetEvent.classList.add('open'); 
                                    
                                    setTimeout(() => {
                                        const y = targetEvent.getBoundingClientRect().top + window.scrollY - 100;
                                        window.scrollTo({top: y, behavior: 'smooth'});
                                    }, 250); 
                                }
                            }, 150); 
                        });
                    }
                })
                .catch(err => {
                    eventsContainer.innerHTML = '<p style="padding: 30px; font-family: var(--font-sans); color: red;">Ops! Impossibile caricare gli eventi.</p>';
                    console.error(err);
                });
        }
    }

    // ==========================================
    // 5. LOGICA ARTISTS (Aggiornata con Immagini!)
    // ==========================================
    const artistsContainer = document.getElementById('artists-container');
    if (artistsContainer) {
        const SHEET_ID_ARTISTS = '1ivpWB8Pe8iO902BvbB5u5IGoFkA5TXI2xcbu7Of5dG0'; 
        const urlArtists = `https://docs.google.com/spreadsheets/d/${SHEET_ID_ARTISTS}/gviz/tq?tqx=out:csv`;

        fetch(urlArtists)
            .then(res => res.text())
            .then(csvText => {
                artistsContainer.innerHTML = '';
                const rows = parseCSV(csvText);
                for (let i = 1; i < rows.length; i++) {
                    const data = rows[i];
                    if (!data[0]) continue; 

                    const aName = data[0] ? data[0].replace(/\n/g, '<br>') : '';
                    const aCat = data[1] ? data[1].replace(/\n/g, '<br>') : '';
                    const aDate = data[2] ? data[2].replace(/\n/g, '<br>') : '';
                    const aDesc = data[3] ? data[3].replace(/\n/g, '<br>') : '';
                    const imageUrl = getDirectImageUrl(data[4]); // Legge la colonna E

                    const article = document.createElement('article');
                    article.className = 'event-item'; 
                    article.innerHTML = `
                        <div class="artist-header">
                            <div class="a-name">${aName}</div>
                            <div class="a-category">${aCat}</div>
                            <div class="a-date">${aDate}</div>
                        </div>
                        <div class="event-details">
                            <!-- Se non c'è l'immagine, il testo prende tutto lo spazio! -->
                            <div class="a-desc" ${!imageUrl ? 'style="grid-column: 1 / -1; padding-right: 0;"' : ''}>
                                <p>${aDesc}</p>
                            </div>
                            <!-- Se c'è l'immagine, crea il blocco laterale -->
                            ${imageUrl ? `
                            <div class="a-image">
                                <img src="${imageUrl}" alt="Artista">
                            </div>` : ''}
                        </div>`;
                    
                    article.querySelector('.artist-header').addEventListener('click', () => {
                        document.querySelectorAll('.event-item').forEach(el => { if(el !== article) el.classList.remove('open'); });
                        article.classList.toggle('open');
                    });
                    artistsContainer.appendChild(article);
                }
            })
            .catch(err => {
                artistsContainer.innerHTML = '<p style="padding: 30px; font-family: var(--font-sans); color: red;">Impossibile caricare gli artisti. Verifica il collegamento al file Google.</p>';
                console.error(err);
            });
    }
});
