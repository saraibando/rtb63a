const eventData = {
    "2024": [
        {name: "Kitesurf", img:"https://res.cloudinary.com/dqinmqte8/image/upload/v1770052396/IMG_0942_doczm9.jpg", desc: "Regata anual en xxx"},
        {name: "Ritmica", img:"https://res.cloudinary.com/dqinmqte8/image/upload/v1770052386/IMG_0963_ltihom.jpg", desc: "Competición xxx"},
        {name: "Navidad", img:"https://res.cloudinary.com/dqinmqte8/image/upload/v1770052396/IMG_0940_npf5lk.jpg", desc: "Gala de navidad"}
    ],
    "2023": [
        {name: "Verano", img:"https://res.cloudinary.com/dqinmqte8/image/upload/v1770052390/IMG_0951_fe8wie.jpg", desc: "Escapada en familia"},
        {name: "Montaña", img:"https://res.cloudinary.com/dqinmqte8/image/upload/v1770052389/IMG_0956_bdypja.jpg", desc: "Erm..."}
    ],
    "2021": [
        {name: "Pandemia", img:"https://res.cloudinary.com/dqinmqte8/image/upload/v1770052396/IMG_0942_doczm9.jpg", desc: "yess"}
    ]
}

const yearTrigger = document.getElementById('current-year');
const yearMenu = document.getElementById('year-menu');
const backBtn = document.getElementById('back-btn');
const menuContent = document.getElementById('menu-content');
const menuBg = document.getElementById('menu-background');

let storedYear = "20XX";

document.addEventListener('DOMContentLoaded', () => {
    const years = Object.keys(eventData).sort((a, b) => b - a);
    const latestYear = years[0];

    if(latestYear) {
        const firstEvent = eventData[latestYear][0];
        if(firstEvent) {
            goToEvent(latestYear, firstEvent);
        }
    }
});

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
                menuBg.style.backgroundImage = `url('${event.img}')`;
                menuBg.classList.add('has-image');
                yearMenu.classList.add('dark-mode');
            });

            textSpan.addEventListener('mouseleave', () => {
                resetBackground();
            });

            textSpan.addEventListener('click', () => {
                goToEvent(year, event);
            });

            el.appendChild(textSpan);
            menuContent.appendChild(el);
        });
    }
}

function resetBackground() {
    if(menuBg) {
        menuBg.classList.remove('has-image');
    }
    if(yearMenu) {
        yearMenu.classList.remove('dark-mode');
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
        <div class="cuerpo"> aaaaaaaaaa </div>
        `;
    }

    console.log(`Cargado: ${event.name} (${year})`);

}

