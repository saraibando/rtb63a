document.addEventListener("DOMContentLoaded", () => {

    const transitionEl = document.querySelector(".page-transition");
    const links = document.querySelectorAll("a");

    setTimeout (() => {
        transitionEl.classList.add("hidden");
    }, 100);

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetUrl = link.href;

            if (link.target !== "_blank" && !targetUrl.includes("#")) {
                e.preventDefault();
                transitionEl.classList.remove("hidden");
                setTimeout (() => {
                    window.location.href = targetUrl;
                }, 800);
            }
        });
    });
});


//transicion dentro misma pagina
const pageSwitchTimeline = gsap.timeline({
    paused: true,
    onComplete: () => isAnimating = false
})
    .set(overlayPath, {
        attr: { d: paths.step1.unfilled }
    })
    .to(overlayPath, {
        duration: 0.8,
        ease: 'power3.in',
        attr: { d: paths.step1.inBetween }
    }, 0)
    .to(overlayPath, {
        duration: 0.2,
        ease: 'power1',
        attr: { d: paths.step1.filled },
        onComplete: () => switchPages()
    })

    .set(overlayPath, {
        attr: { d: paths.step2.filled }
    })

    .to(overlayPath, {
        duration: 0.15,
        ease: 'sine.in',
        attr: { d: paths.step2.inBetween }
    })
    .to(overlayPath, {
        duration: 1,
        ease: 'power4',
        attr: { d: paths.step2.unfilled }
    });

const switchPages = () => {
    if (page === 2) {
        landingEl.classList.add('view--open');
        window.dispatchEvent(new CustomEvent('stop-threejs'));
    }
    else {
        landingEl.classList.remove('view--open');
        window.dispatchEvent(new CustomEvent('start-threejs'))
    }
}

const reveal = () => {

    if (isAnimating) return;
    isAnimating = true;

    page = 2;

    pageSwitchTimeline.play(0);
}
