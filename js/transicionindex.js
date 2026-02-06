const overlayPath1 = document.querySelector('.overlay__path');
const overlayPath2 = document.querySelector('.overlay__path1');
const logoPath = document.querySelector('.logo__path');

let logoLength = 0;

if(logoPath) {
    logoLength = logoPath.getTotalLength() + 1;
    logoPath.style.strokeDasharray = logoLength;
    logoPath.style.strokeDashoffset = logoLength;
    logoPath.style.opacity = '1';    
}


const paths = {
    step1: {
        unfilled: 'M 0 0 V 0 Q 50 0 100 0 V 0 H 0 Z',
        inBetween: 'M 0 0 V 50 Q 50 100 100 50 V 0 H 0 Z',
        filled: 'M 0 0 V 100 Q 50 100 100 100 V 0 H 0 Z',
    },
    step2: {
        filled: 'M 0 100 V 0 Q 50 0 100 0 V 100 H 0 Z',
        inBetween: 'M 0 100 V 50 Q 50 100 100 50 V 100 H 0 Z',
        unfilled: 'M 0 100 V 100 Q 50 100 100 100 V 100 H 0 Z',
    }
};

let isAnimating = false;

const pageEntrance = () => {
    const tl = gsap.timeline ({
        onComplete: () => isAnimating = false
    });

    if(logoPath){ 
        gsap.set(logoPath, { strokeDashoffset: logoLength, opacity: 1});
    }

    tl.set(overlayPath1, {
        attr: { d: paths.step2.filled}
    })
    .to(logoPath, {
        strokeDashoffset: 0,
        duration: 2.0,
        ease: "power2.inOut"
    })

    .to(logoPath, {
        duration: 0.5,
        opacity: 0,
        ease: "power2.out"
    })

    .to(overlayPath1, {
        duration: 0.5,
        ease: 'sine.in',
        attr: { d: paths.step2.inBetween }
    }, "-=0.2")
    .to(overlayPath1, {
        duration: 1.4,
        ease: 'power4',
        attr: { d: paths.step2.unfilled}
    });
}

const pageExist = (targetUrl) => {
    if (isAnimating) return;
    isAnimating = true;

    const tl = gsap.timeline({
        onComplete: () => {
            window.dispatchEvent(new CustomEvent('stop-threejs'));
            window.location.href = targetUrl;
        }
    });

    if(logoPath) {
        gsap.set(logoPath, { opacity: 0});
    }  

    tl.set(overlayPath2, {
        attr: { d: paths.step1.unfilled }
    })
    .to(overlayPath2, {
        duration: 0.6,
        ease: 'power3.in',
        attr: { d: paths.step1.inBetween }
    }, 0)
    .to(overlayPath2, {
        duration: 1,
        ease: 'power1',
        attr: { d: paths.step1.filled }
    });
};

window.addEventListener('load', () => {
    window.dispatchEvent( new CustomEvent('start-threejs'));
    pageEntrance();
});

document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetUrl = link.href;

            if (link.hostname === window.location.hostname && targetUrl.indexOf('#') === -1) {
                e.preventDefault();

                pageExist( targetUrl);
            }
        });
    });
});