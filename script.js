let string = document.querySelector(".display");
let buttons = document.querySelectorAll(".button2");
let count = 1;


function msg() {
    alert("Turn ON the calculator first");
}

function defaultstate() {
    buttons.forEach((button) => {
        button.addEventListener("click", msg);
    });
    string.value = "";
    document.querySelector("#casiotext").style.cssText = "opacity: 0;"
    document.querySelector("#caret").style.cssText = "display: none;"
}

function key(e) {
    switch (e.target.innerHTML) {
        case '×':
            string.value = string.value + '*';
            break;
        case '÷':
            string.value = string.value + '/';
            break;
        case '=':
            string.value = eval(string.value);
            answer = string.value;
            break;
        case 'AC':
            string.value = "";
            break;
        case 'DEL':
            string.value = string.value.substr(0, string.value.length - 1);
            break;
        case 'Ans':
            string.value = string.value + answer;
            break;
        case '×10ⁿ':
            string.value = string.value + '*10^';
            break;
        default:
            string.value = string.value + e.target.innerHTML;
    }
}

function activestate() {
    buttons.forEach((button) => {
        button.addEventListener("click", key);
    });
    document.querySelector("#casiotext").style.cssText = "opacity:0; animation:fadein ease 2s;"
    document.querySelector("#caret").style.cssText = "opacity:0;"
}

if (count == 1) {
    defaultstate();
}

document.querySelector("#on").addEventListener("click", () => {
    count++;
    if (count % 2 == 0) {
        buttons.forEach((button) => {
            button.removeEventListener("click", msg);
        });
        activestate();
    }
    else {
        buttons.forEach((button) => {
            button.removeEventListener("click", key);
        });
        defaultstate();
    }
});

let disabledbuttons = document.querySelectorAll(".button1");
disabledbuttons.forEach(button => {
    button.addEventListener("click", () => {
        alert("This feature is still under construction");
    });
});
