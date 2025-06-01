const quoteText = document.querySelector('.quote-text');
const quoteAuthor = document.querySelector('.quote-author');

const prevQuoteBtn = document.getElementById('prev-quote-btn');
const nextQuoteBtn = document.getElementById('next-quote-btn');

// NUEVOS ELEMENTOS DE LA PANTALLA DE BIENVENIDA
const splashScreen = document.getElementById('splash-screen');
const enterAppBtn = document.getElementById('enter-app-btn');
const mainApp = document.getElementById('main-app');

let quotes = [];
let currentQuoteIndex = -1;
let availableQuoteIndices = [];
let quoteHistory = [];
let historyPointer = -1;

const SESSION_STORAGE_KEY = 'quoteAppHistory';
// const HAS_ENTERED_SESSION_KEY = 'hasEnteredSession'; // Eliminamos esta clave, ya no la usaremos para mostrar la splash

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function saveState() {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        quoteHistory: quoteHistory,
        historyPointer: historyPointer,
        currentQuoteIndex: currentQuoteIndex
    }));
}

function loadState() {
    const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedState) {
        const state = JSON.parse(savedState);
        quoteHistory = state.quoteHistory;
        historyPointer = state.historyPointer;
        currentQuoteIndex = state.currentQuoteIndex;
    } else {
        quoteHistory = [];
        historyPointer = -1;
        currentQuoteIndex = -1;
    }
}

function displayQuote() {
    if (currentQuoteIndex !== -1 && quotes.length > 0) {
        const currentQuote = quotes[currentQuoteIndex];
        quoteText.textContent = currentQuote.quote;
        quoteAuthor.textContent = currentQuote.author;
    } else {
        quoteText.textContent = 'No hay frases disponibles.';
        quoteAuthor.textContent = '';
    }
    updateButtonStates();
    saveState();
}

function updateButtonStates() {
    prevQuoteBtn.disabled = historyPointer <= 0;

    const noMoreRandomQuotes = availableQuoteIndices.length === 0 && quotes.length > 0 && quoteHistory.length === quotes.length;
    nextQuoteBtn.disabled = quotes.length === 0 || (historyPointer >= quoteHistory.length - 1 && noMoreRandomQuotes);
}

function goToNextQuoteSmart() {
    if (quotes.length === 0) {
        quoteText.textContent = 'No hay frases disponibles.';
        quoteAuthor.textContent = '';
        return;
    }

    if (historyPointer < quoteHistory.length - 1) {
        historyPointer++;
        currentQuoteIndex = quoteHistory[historyPointer];
    } else {
        if (availableQuoteIndices.length === 0) {
            availableQuoteIndices = Array.from({ length: quotes.length }, (_, i) => i);
            shuffleArray(availableQuoteIndices);
        }

        let nextRandomIndex = availableQuoteIndices.pop();
        
        if (quotes.length > 1 && nextRandomIndex === currentQuoteIndex && availableQuoteIndices.length > 0) {
            availableQuoteIndices.push(nextRandomIndex);
            shuffleArray(availableQuoteIndices);
            nextRandomIndex = availableQuoteIndices.pop();
        }

        currentQuoteIndex = nextRandomIndex;

        quoteHistory.push(currentQuoteIndex);
        historyPointer = quoteHistory.length - 1;
    }

    displayQuote();
}

function goToPreviousQuote() {
    if (historyPointer > 0) {
        historyPointer--;
        currentQuoteIndex = quoteHistory[historyPointer];
        displayQuote();
    } else {
        console.log('No hay citas anteriores en el historial.');
    }
}

// NUEVA FUNCIÓN: Inicializar la aplicación
function initializeApp() {
    // const hasEnteredSession = sessionStorage.getItem(HAS_ENTERED_SESSION_KEY); // Eliminamos esta línea

    // if (hasEnteredSession === 'true') { // Eliminamos este condicional
    //     splashScreen.classList.add('hidden');
    //     mainApp.classList.add('visible');
    //     loadQuotes();
    // } else {
        // Siempre mostrar la pantalla de bienvenida al cargar/recargar
        splashScreen.classList.add('visible');
        mainApp.classList.add('hidden'); // Asegurarse de que la app principal está oculta al inicio

        enterAppBtn.addEventListener('click', () => {
            // sessionStorage.setItem(HAS_ENTERED_SESSION_KEY, 'true'); // Eliminamos esta línea
            splashScreen.classList.remove('visible');
            splashScreen.classList.add('hidden');
            // Espera a que la transición termine antes de mostrar la app principal
            splashScreen.addEventListener('transitionend', () => {
                mainApp.classList.remove('hidden');
                mainApp.classList.add('visible');
                loadQuotes(); // Carga las citas una vez la app principal es visible
            }, { once: true }); // Asegura que el listener se ejecute solo una vez
        });
    // } // Eliminamos el cierre del condicional
}

// Función para cargar las citas (separada del initialApp para mejor control)
function loadQuotes() {
    fetch('citas/quotes.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - Could not load quotes.json`);
            }
            return response.json();
        })
        .then(data => {
            quotes = data;
            loadState();
            
            if (currentQuoteIndex === -1 || quotes.length === 0 || currentQuoteIndex >= quotes.length || quoteHistory.length === 0) {
                availableQuoteIndices = Array.from({ length: quotes.length }, (_, i) => i);
                shuffleArray(availableQuoteIndices);
                goToNextQuoteSmart();
            } else {
                const seenQuotes = new Set(quoteHistory);
                availableQuoteIndices = Array.from({ length: quotes.length }, (_, i) => i)
                                            .filter(index => !seenQuotes.has(index));
                shuffleArray(availableQuoteIndices);
                displayQuote();
            }
        })
        .catch(error => {
            console.error('Error loading quotes:', error);
            quoteText.textContent = 'Error al cargar las frases. Por favor, asegúrese de que el archivo citas/quotes.json existe y está bien formado.';
            quoteAuthor.textContent = '';
            updateButtonStates();
        });
}


nextQuoteBtn.addEventListener('click', goToNextQuoteSmart);
prevQuoteBtn.addEventListener('click', goToPreviousQuote);

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        goToNextQuoteSmart();
        event.preventDefault();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        goToPreviousQuote();
        event.preventDefault();
    }
});

// Inicializar la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializeApp);

// Eliminamos esta parte, ya que queremos que la splash screen aparezca siempre al recargar
// window.addEventListener('beforeunload', () => {
//     sessionStorage.removeItem(HAS_ENTERED_SESSION_KEY);
// });