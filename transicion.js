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