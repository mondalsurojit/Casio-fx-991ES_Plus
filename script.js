// ========== CASIO fx-991ES PLUS CALCULATOR ENGINE ==========

const display = document.getElementById('display');
const shiftIndicator = document.getElementById('shift-indicator');
const alphaIndicator = document.getElementById('alpha-indicator');
const degIndicator = document.getElementById('deg-indicator');
const radIndicator = document.getElementById('rad-indicator');
const mIndicator = document.getElementById('m-indicator');
const themeToggle = document.getElementById('theme-toggle');

let expression = '';
let answer = 0;
let memory = 0;
let shiftMode = false;
let alphaMode = false;
let degMode = true;
let hypMode = false;
let history = [];
let historyIndex = -1;

// === THEME TOGGLE LOGIC ===
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('calculator-theme', themeName);
}

function initTheme() {
    const savedTheme = localStorage.getItem('calculator-theme') || 'midnight';
    setTheme(savedTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'midnight' ? 'classic' : 'midnight';
    setTheme(newTheme);
});

// === INITIALIZATION ===
initTheme();

// Startup animation
setTimeout(() => {
    document.getElementById('casiotext').style.display = 'none';
    updateDisplay();
}, 2500);

function updateDisplay() {
    if (expression === '') {
        display.value = '0';
    } else {
        display.value = formatDisplay(expression);
    }
}

function formatDisplay(expr) {
    return expr
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/Math\.PI/g, 'π')
        .replace(/Math\.E/g, 'e');
}

function resetShiftAlpha() {
    shiftMode = false;
    alphaMode = false;
    hypMode = false;
    shiftIndicator.classList.remove('active');
    alphaIndicator.classList.remove('active');

    document.querySelectorAll('.button3').forEach(btn => {
        btn.classList.remove('active-shift', 'active-alpha');
    });
}

function toRadians(deg) {
    return deg * Math.PI / 180;
}

function toDegrees(rad) {
    return rad * 180 / Math.PI;
}

function factorial(n) {
    if (n < 0 || n > 170 || !Number.isInteger(n)) return NaN;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function decimalToFraction(decimal, tolerance = 1e-10) {
    if (Math.abs(decimal - Math.round(decimal)) < tolerance) {
        return { num: Math.round(decimal), den: 1 };
    }

    let sign = decimal < 0 ? -1 : 1;
    decimal = Math.abs(decimal);

    let a = 0, b = 1;
    let c = 1, d = 0;

    while (true) {
        let whole = Math.floor(decimal);
        let num = a + whole * c;
        let den = b + whole * d;

        if (Math.abs(decimal - whole) < tolerance) {
            return { num: sign * num, den: den };
        }

        decimal = 1 / (decimal - whole);
        a = c;
        b = d;
        c = num;
        d = den;

        if (den > 10000) break;
    }

    return null;
}

function formatResult(value) {
    if (isNaN(value) || !isFinite(value)) return 'Error';

    // Check if it can be a nice fraction
    const frac = decimalToFraction(value);
    if (frac && frac.den > 1 && frac.den <= 100) {
        return `${frac.num}/${frac.den}`;
    }

    // Format large/small numbers
    if (Math.abs(value) > 1e10 || (Math.abs(value) < 1e-6 && value !== 0)) {
        return value.toExponential(6);
    }

    // Round to avoid floating point errors
    let rounded = parseFloat(value.toPrecision(12));
    return rounded.toString();
}

function evaluate() {
    if (!expression.trim()) return;

    // Save to history
    history.push(expression);
    historyIndex = history.length;

    let processed = expression;

    // Replace constants
    processed = processed.replace(/π/g, `(${Math.PI})`);
    processed = processed.replace(/e(?![x])/g, `(${Math.E})`);

    // Replace Ans
    processed = processed.replace(/Ans/g, `(${answer})`);

    // Handle implicit multiplication
    processed = processed.replace(/(\d)\(/g, '$1*(');
    processed = processed.replace(/\)(\d)/g, ')*$1');
    processed = processed.replace(/(\d)π/g, '$1*π');

    // Powers
    processed = processed.replace(/(\d+\.?\d*)\^(\d+\.?\d*)/g, 'Math.pow($1,$2)');
    processed = processed.replace(/(\d+\.?\d*)²/g, 'Math.pow($1,2)');
    processed = processed.replace(/(\d+\.?\d*)³/g, 'Math.pow($1,3)');

    // Roots
    processed = processed.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
    processed = processed.replace(/√(\d+\.?\d*)/g, 'Math.sqrt($1)');
    processed = processed.replace(/∛\(([^)]+)\)/g, 'Math.cbrt($1)');

    // Logarithms
    processed = processed.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
    processed = processed.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
    processed = processed.replace(/logₐ\(([^,]+),([^)]+)\)/g, '(Math.log($2)/Math.log($1))');

    // Exponential
    processed = processed.replace(/10ˣ\(([^)]+)\)/g, 'Math.pow(10,$1)');
    processed = processed.replace(/eˣ\(([^)]+)\)/g, 'Math.exp($1)');

    // Trig functions
    processed = processed.replace(/sin\(([^)]+)\)/g, (m, arg) => 
        `Math.sin(${degMode ? `toRadians(${arg})` : arg})`);
    processed = processed.replace(/cos\(([^)]+)\)/g, (m, arg) => 
        `Math.cos(${degMode ? `toRadians(${arg})` : arg})`);
    processed = processed.replace(/tan\(([^)]+)\)/g, (m, arg) => 
        `Math.tan(${degMode ? `toRadians(${arg})` : arg})`);

    // Inverse trig
    processed = processed.replace(/asin\(([^)]+)\)/g, (m, arg) => 
        `${degMode ? `(Math.asin(${arg})*180/Math.PI)` : `Math.asin(${arg})`}`);
    processed = processed.replace(/acos\(([^)]+)\)/g, (m, arg) => 
        `${degMode ? `(Math.acos(${arg})*180/Math.PI)` : `Math.acos(${arg})`}`);
    processed = processed.replace(/atan\(([^)]+)\)/g, (m, arg) => 
        `${degMode ? `(Math.atan(${arg})*180/Math.PI)` : `Math.atan(${arg})`}`);

    // Hyperbolic
    processed = processed.replace(/sinh\(([^)]+)\)/g, 'Math.sinh($1)');
    processed = processed.replace(/cosh\(([^)]+)\)/g, 'Math.cosh($1)');
    processed = processed.replace(/tanh\(([^)]+)\)/g, 'Math.tanh($1)');

    // Factorial
    processed = processed.replace(/(\d+)!/g, (m, n) => factorial(parseInt(n)));

    // Percentage
    processed = processed.replace(/(\d+\.?\d*)%/g, '($1/100)');

    // Scientific notation
    processed = processed.replace(/(\d+\.?\d*)×10\^(\(?[^)]+\)?)/g, '($1*Math.pow(10,$2))');

    // Fractions (a|b/c format)
    processed = processed.replace(/(\d+)\|(\d+)\/(\d+)/g, '(($1*($3)+$2)/$3)');

    // Make toRadians available
    window.toRadians = toRadians;

    try {
        let result = Function('"use strict"; return (' + processed + ')')();
        answer = result;
        expression = formatResult(result);
        updateDisplay();
    } catch (e) {
        expression = 'Syntax Error';
        updateDisplay();
        expression = '';
    }
}

function insertText(text) {
    expression += text;
    updateDisplay();
}

function handleButton(action, value, btn) {
    // Handle SHIFT toggle
    if (action === 'shift') {
        shiftMode = !shiftMode;
        alphaMode = false;
        shiftIndicator.classList.toggle('active', shiftMode);
        alphaIndicator.classList.remove('active');

        document.querySelectorAll('.button3').forEach(b => {
            b.classList.remove('active-alpha');
            b.classList.toggle('active-shift', shiftMode && b.dataset.action === 'shift');
        });
        return;
    }

    // Handle ALPHA toggle
    if (action === 'alpha') {
        alphaMode = !alphaMode;
        shiftMode = false;
        alphaIndicator.classList.toggle('active', alphaMode);
        shiftIndicator.classList.remove('active');

        document.querySelectorAll('.button3').forEach(b => {
            b.classList.remove('active-shift');
            b.classList.toggle('active-alpha', alphaMode && b.dataset.action === 'alpha');
        });
        return;
    }

    // Handle numbers with ALPHA mode
    if (value !== undefined) {
        if (alphaMode) {
            const alphaMap = {
                '7': 'N', '8': 'O', '9': 'P',
                '4': 'Q', '5': 'R', '6': 'S',
                '1': 'V', '2': 'W', '3': 'X',
                '0': 'θ', '.': 'r'
            };
            if (alphaMap[value]) {
                insertText(alphaMap[value]);
            }
            resetShiftAlpha();
            return;
        }

        if (shiftMode && value === '.') {
            insertText('π');
            resetShiftAlpha();
            return;
        }

        insertText(value);
        resetShiftAlpha();
        return;
    }

    // Handle actions
    switch (action) {
        case 'on':
            expression = '';
            answer = 0;
            resetShiftAlpha();
            updateDisplay();
            break;

        case 'ac':
            expression = '';
            resetShiftAlpha();
            updateDisplay();
            break;

        case 'del':
            expression = expression.slice(0, -1);
            resetShiftAlpha();
            updateDisplay();
            break;

        case 'equals':
            evaluate();
            resetShiftAlpha();
            break;

        case 'add':
            insertText('+');
            resetShiftAlpha();
            break;

        case 'sub':
            insertText('-');
            resetShiftAlpha();
            break;

        case 'mul':
            if (shiftMode) {
                insertText('P(');
            } else {
                insertText('*');
            }
            resetShiftAlpha();
            break;

        case 'div':
            if (shiftMode) {
                insertText('C(');
            } else {
                insertText('/');
            }
            resetShiftAlpha();
            break;

        case 'ans':
            if (shiftMode) {
                degMode = !degMode;
                degIndicator.classList.toggle('active', degMode);
                radIndicator.classList.toggle('active', !degMode);
            } else {
                insertText('Ans');
            }
            resetShiftAlpha();
            break;

        case 'exp':
            if (shiftMode) {
                insertText('e');
            } else {
                insertText('×10^(');
            }
            resetShiftAlpha();
            break;

        case 'negate':
            insertText('(-');
            resetShiftAlpha();
            break;

        case 'lparen':
            insertText('(');
            resetShiftAlpha();
            break;

        case 'rparen':
            insertText(')');
            resetShiftAlpha();
            break;

        case 'square':
            if (shiftMode) {
                insertText('³');
            } else {
                insertText('²');
            }
            resetShiftAlpha();
            break;

        case 'power':
            if (shiftMode) {
                insertText('^(-1)');
            } else {
                insertText('^(');
            }
            resetShiftAlpha();
            break;

        case 'sqrt':
            if (shiftMode) {
                insertText('∛(');
            } else {
                insertText('√(');
            }
            resetShiftAlpha();
            break;

        case 'log':
            if (shiftMode) {
                insertText('10ˣ(');
            } else {
                insertText('log(');
            }
            resetShiftAlpha();
            break;

        case 'ln':
            if (shiftMode) {
                insertText('eˣ(');
            } else {
                insertText('ln(');
            }
            resetShiftAlpha();
            break;

        case 'sin':
            if (shiftMode) {
                insertText('asin(');
            } else if (hypMode) {
                insertText('sinh(');
                hypMode = false;
            } else {
                insertText('sin(');
            }
            resetShiftAlpha();
            break;

        case 'cos':
            if (shiftMode) {
                insertText('acos(');
            } else if (hypMode) {
                insertText('cosh(');
                hypMode = false;
            } else {
                insertText('cos(');
            }
            resetShiftAlpha();
            break;

        case 'tan':
            if (shiftMode) {
                insertText('atan(');
            } else if (hypMode) {
                insertText('tanh(');
                hypMode = false;
            } else {
                insertText('tan(');
            }
            resetShiftAlpha();
            break;

        case 'hyp':
            hypMode = !hypMode;
            if (hypMode) {
                shiftIndicator.classList.add('active');
            } else {
                shiftIndicator.classList.remove('active');
            }
            break;

        case 'x-1':
            if (shiftMode) {
                // Factorial
                insertText('!');
            } else {
                insertText('^(-1)');
            }
            resetShiftAlpha();
            break;

        case 'logbase':
            if (shiftMode) {
                insertText('√(');
            } else {
                insertText('logₐ(10,');
            }
            resetShiftAlpha();
            break;

        case 'sd':
            // Toggle fraction/decimal display
            if (expression.includes('/')) {
                try {
                    let result = eval(expression.replace(/π/g, Math.PI).replace(/e/g, Math.E));
                    expression = formatResult(result);
                    updateDisplay();
                } catch(e) {}
            } else {
                let num = parseFloat(expression);
                if (!isNaN(num)) {
                    let frac = decimalToFraction(num);
                    if (frac && frac.den > 1) {
                        expression = `${frac.num}/${frac.den}`;
                        updateDisplay();
                    }
                }
            }
            resetShiftAlpha();
            break;

        case 'mplus':
            if (shiftMode) {
                memory -= answer;
            } else {
                memory += answer;
            }
            mIndicator.classList.toggle('active', memory !== 0);
            resetShiftAlpha();
            break;

        case 'rcl':
            if (shiftMode) {
                memory = answer;
                mIndicator.classList.add('active');
            } else {
                insertText(memory.toString());
            }
            resetShiftAlpha();
            break;

        case 'eng':
            // Engineering notation toggle
            let val = parseFloat(expression);
            if (!isNaN(val)) {
                expression = val.toExponential(3);
                updateDisplay();
            }
            resetShiftAlpha();
            break;

        case 'mode':
            // Toggle Deg/Rad
            degMode = !degMode;
            degIndicator.classList.toggle('active', degMode);
            radIndicator.classList.toggle('active', !degMode);
            resetShiftAlpha();
            break;

        case 'integral':
            insertText('∫(');
            resetShiftAlpha();
            break;

        case 'calc':
            evaluate();
            resetShiftAlpha();
            break;
    }
}

// Attach event listeners
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const value = btn.dataset.value;
        handleButton(action, value, btn);
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (key >= '0' && key <= '9') {
        handleButton(undefined, key, null);
    } else if (key === '.') {
        handleButton(undefined, '.', null);
    } else if (key === '+') {
        handleButton('add', undefined, null);
    } else if (key === '-') {
        handleButton('sub', undefined, null);
    } else if (key === '*') {
        handleButton('mul', undefined, null);
    } else if (key === '/') {
        e.preventDefault();
        handleButton('div', undefined, null);
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleButton('equals', undefined, null);
    } else if (key === 'Escape') {
        handleButton('ac', undefined, null);
    } else if (key === 'Backspace') {
        handleButton('del', undefined, null);
    } else if (key === '(') {
        handleButton('lparen', undefined, null);
    } else if (key === ')') {
        handleButton('rparen', undefined, null);
    } else if (key === '^') {
        handleButton('power', undefined, null);
    }
});

// Initialize
updateDisplay();
