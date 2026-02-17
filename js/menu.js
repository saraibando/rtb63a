const cloudName = "dqinmqte8"; // Tu usuario de Cloudinary

const imageCache = {};
// 1. Declaramos la variable vacía al principio
let eventData = {}; 

// ... tus selectores (yearTrigger, menuContent, etc) siguen igual ...
const yearTrigger = document.getElementById('current-year');
const yearMenu = document.getElementById('year-menu');
const backBtn = document.getElementById('back-btn');
const menuContent = document.getElementById('menu-content');
const menuBg = document.getElementById('menu-background');

let storedYear = "20XX";

// 2. Cargamos los datos ANTES de iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    
    // Fetch busca el archivo JSON
    fetch('../informacion/eventos.json') 
        .then(response => response.json()) // Lo convierte a objeto JS
        .then(data => {
            eventData = data; // ¡Aquí guardamos los datos del archivo!
            
            // Una vez tenemos los datos, iniciamos la web:
            iniciarMenu(); 
        })
        .catch(error => console.error("Error cargando el JSON:", error));
});

// 3. Metemos la lógica de inicio en una función aparte
function iniciarMenu() {
    const years = Object.keys(eventData).sort((a, b) => b - a);
    const latestYear = years[0];

    if(latestYear) {
        const firstEvent = eventData[latestYear][0];
        if(firstEvent) {
            goToEvent(latestYear, firstEvent);
        }
    }
}

yearTrigger.addEventListener('click', () => {
    if(yearMenu.classList.contains('active')) {
        closeMenu();
    }else{
        openMenu();
    }
});

if(backBtn) {
    backBtn.addEventListener('click', () => {
        showYears();
        resetBackground();
    }); 
}

function openMenu() {
    storedYear = yearTrigger.innerText;
    yearTrigger.innerText = "[ X ]";
    showYears();
    yearMenu.classList.add('active');
}

function closeMenu() {
    yearTrigger.innerText = storedYear;
    yearMenu.classList.remove('active');
    resetBackground();
}

function showYears() {
    menuContent.innerHTML = '';
    if(backBtn) backBtn.classList.add('hidden');

    const years = Object.keys(eventData).sort((a, b) => b - a);

    years.forEach(year => {
        const el = document.createElement('div');
        el.className = 'menu-link';
        el.innerHTML = `<span class="menu-sub">(${eventData[year].length}) </span> <span class="anos">${year}</span>`;
        el.addEventListener('click', () => {
            showEvents(year);
        });

        menuContent.appendChild(el);
    });
}

function showEvents(year) {
    menuContent.innerHTML = '';
    if(backBtn) backBtn.classList.remove('hidden');

    const events = eventData[year];

    if (events) {
        events.forEach(event => {
            const el = document.createElement('div');
            el.className = 'menu-link';

            const textSpan = document.createElement('span');
            textSpan.className = 'link-text';
            textSpan.innerHTML = event.name;
            
            textSpan.addEventListener('mouseenter', () => {
                let imagenAUsar = event.img;

                if(event.tag && imageCache[event.tag] && imageCache[event.tag].length > 0) {
                    const fotos = imageCache[event.tag];
                    const randomFoto = fotos[Math.floor(Math.random() * fotos.length)];
                    imagenAUsar = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1000/${randomFoto.public_id}.${randomFoto.format}`;
                }
                else if(event.tag && !imageCache[event.tag]) {
                    descargarListaFotos(event.tag);
                }


                menuBg.style.backgroundImage = `url('${imagenAUsar}')`;
                menuBg.classList.add('has-image');
                yearMenu.classList.add('dark-mode');
                yearTrigger.classList.add('dark-mode')
            });

            textSpan.addEventListener('mouseleave', () => {
                resetBackground();
            });

            textSpan.addEventListener('click', () => {
                goToEvent(year, event);
            });

            el.appendChild(textSpan);
            menuContent.appendChild(el);

            if(event.tag) descargarListaFotos(event.tag);
        });
    }
}

function resetBackground() {
    if(menuBg) {
        menuBg.classList.remove('has-image');
    }
    if(yearMenu) {
        yearMenu.classList.remove('dark-mode');
        yearTrigger.classList.remove('dark-mode')
    }
}

function goToEvent(year, event) {
    yearMenu.classList.remove('active');
    yearTrigger.innerText = year;
    storedYear = year;

    document.body.style.backgroundImage = ``;
    const mainContainer = document.querySelector('main');
    if(mainContainer) {
        mainContainer.innerHTML = `
        <div class="encabezado">
            <h1>${event.name}</h1>
            <p>${event.desc}</p>
        </div>
        <div class="cuerpo"> 
            <div id= "galeria-grid" class="galeria-grid"></div>
        </div>
        `;
    }

    if (event.tag) {
        cargarFotosCloudinary(event.tag);
    } else {
        document.getElementById('galeria-grid').innerHTML = '<p>No hay fotos disponibles para este evento.</p>';
    }

    console.log(`Cargado: ${event.name} (${year})`);
}

function cargarFotosCloudinary(tag) {
    const container = document.getElementById('galeria-grid');
    const url = `https://res.cloudinary.com/${cloudName}/image/list/${tag}.json`;

    container.innerHTML = '<p style= "grid-column: 1 / -1; text-align: center; opacity: 0.7;">Cargando ...</p>';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';

            data.resources.forEach(image => {
                const img = document.createElement('img');
                img.src = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_800/${image.public_id}.${image.format}`;
                img.alt = `Foto de ${tag}`;
                img.loading = 'lazy';

                container.appendChild(img);
            });
        })
        .catch(error => {
            console.error('Error al cargar las fotos:', error);
            container.innerHTML = '<p style= "grid-column: 1 / -1;">No se pudieron cargar las imágenes, revisa que el Tag sea correcto y la lista pública.</p>';
        });
}

function descargarListaFotos(tag) {

    if(imageCache[tag]) return; // Si ya la tenemos, no hacemos nada

    imageCache[tag] = []; // Creamos un array vacío para este tag

    const url = `https://res.cloudinary.com/${cloudName}/image/list/${tag}.json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if(data.resources) {
                imageCache[tag] = data.resources; // Guardamos la lista completa en el cache
                console.log(`Lista de fotos para tag "${tag}": ${data.resources.length} fotos.`);
            }
        })
        .catch(error => console.error(`Error al descargar la lista de fotos para tag "${tag}":`, error));
}