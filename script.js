document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GESTIONE MENU ATTIVO E FRECCIA ANIMATA
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-menu a');
    const arrow = document.querySelector('.menu-arrow');
    const sidebar = document.querySelector('.sidebar');
    let currentPath = window.location.pathname.split('/').pop();
    let activeLink = null;

    if (currentPath === '') currentPath = 'index.html'; 

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPath) {
            link.classList.add('active');
            activeLink = link;
        } else {
            link.classList.remove('active');
        }
    });

    function moveArrowTo(element) {
        if (!element) {
            arrow.classList.remove('show');
            return;
        }
        const linkRect = element.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        const topPosition = linkRect.top - sidebarRect.top + (linkRect.height / 2);
        arrow.style.top = `${topPosition}px`;
        arrow.classList.add('show');
    }

    if (activeLink) {
        setTimeout(() => moveArrowTo(activeLink), 50);
    } else {
        arrow.classList.remove('show');
    }

    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() { moveArrowTo(this); });
    });

    sidebar.addEventListener('mouseleave', function() {
        if (activeLink) moveArrowTo(activeLink);
        else arrow.classList.remove('show');
    });

    // ==========================================
    // 2. LOGICA MULTI-SHEET (ART & HUB)
    // ==========================================
    const eventsContainer = document.getElementById('events-container');

    if (eventsContainer) {
        let SHEET_ID = '';
        let TAB_NAME = '';

        // Configurazione differenziata per pagina
        if (currentPath === 'art-events.html') {
            SHEET_ID = '1_Tv5lTTCD8g6jFKB5aOUnN1yklCbzPcZgU0zcLzKX2w';
            TAB_NAME = 'Art_Events';
        } else if (currentPath === 'hub-events.html') {
            // NUOVO ID PER HUB EVENTS
            SHEET_ID = '139s2vPitxXyqubkfUPQrlse6ZoQbbe7CiPaFpE2jpZ8';
            TAB_NAME = 'Hub_Events';
        }

        if (SHEET_ID !== '' && TAB_NAME !== '') {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${TAB_NAME}`;

            fetch(url)
                .then(response => response.text())
                .then(csvText => {
                    eventsContainer.innerHTML = ''; 

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

                    const rows = parseCSV(csvText);

                    for (let i = 1; i < rows.length; i++) {
                        const data = rows[i];
                        if (data.length < 2 || !data[0]) continue;

                        // MAPPATURA SECONDO IL TUO ORDINE: A, B, C, D, E, F, G
                        const date = (data[0] || '').replace(/\n/g, '<br>');      // A: Data
                        const artist = (data[1] || '').toUpperCase();             // B: Nome Artista
                        const title = data[2] || '';                              // C: Titolo Mostra
                        const description = (data[3] || '').replace(/\n/g, '<br>'); // D: Descrizione
                        const imageUrl = (data[4] || '').trim();                  // E: ImageUrl
                        const link = (data[5] || '').trim();                      // F: TicketLink
                        const location = (data[6] || '').replace(/\n/g, '<br>');  // G: Location
                        const price = ''; 

                        const article = document.createElement('article');
                        article.className = 'event-item';

                        article.innerHTML = `
                            <div class="event-header">
                                <div class="e-date">${date}</div>
                                <div class="e-title">${artist}<br>“${title}”</div>
                                <div class="e-loc">${location}</div>
                                <div class="e-price">${price}</div>
                            </div>
                            <div class="event-details">
                                <div class="e-desc">
                                    <p>${description}</p>
                                    ${link !== '' && link !== '#' ? `<a href="${link}" target="_blank" class="buy-tickets">Buy tickets here</a>` : ''}
                                </div>
                                <div class="e-image">
                                    ${imageUrl !== '' ? `<img src="${imageUrl}" alt="Immagine dell'evento">` : ''}
                                </div>
                            </div>
                        `;

                        const header = article.querySelector('.event-header');
                        header.addEventListener('click', function() {
                            document.querySelectorAll('.event-item').forEach(el => {
                                if (el !== article) el.classList.remove('open');
                            });
                            article.classList.toggle('open');
                        });

                        eventsContainer.appendChild(article);
                    }
                })
                .catch(error => {
                    console.error('Errore:', error);
                    eventsContainer.innerHTML = '<p style="padding: 20px; color: red;">Errore nel caricamento dei dati.</p>';
                });
        }
    }
});
