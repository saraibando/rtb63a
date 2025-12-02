const hour = document.getElementById("hours");
const minutes = document.getElementById("min");
function clock(){
    let today = new Date ();

    let h = today.getHours();
    let m = today.getMinutes();

    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;

    hour.textContent = h;
    minutes.textContent = m;
}


let interval = setInterval(clock,1000);