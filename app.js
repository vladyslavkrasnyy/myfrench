// State management
let topics = {};
let currentTopic = null;
let currentIndex = 0;
let currentWord = null;
let options = [];
let score = 0;
let questionCount = 0;
let timer = null;
let currentLanguage = 'english'; // Default language

// Base path for GitHub Pages
const basePath = '/myfrench';

// Supported languages configuration
const supportedLanguages = {
    english: {
        name: 'English',
        code: 'en'
    },
    ukrainian: {
        name: 'Українська',
        code: 'uk'
    }
};

// UI text translations
const uiTranslations = {
    english: {
        selectTopic: 'Select Topic',
        chooseMode: 'Choose Mode',
        learningMode: 'Learning Mode',
        testingMode: 'Testing Mode',
        backToTopics: 'Back to Topics',
        score: 'Score',
        question: 'Question',
        time: 'Time',
        summary: 'Summary',
        finalScore: 'Final Score',
        accuracy: 'Accuracy',
        previous: 'Previous',
        next: 'Next',
        back: 'Back'
    },
    ukrainian: {
        selectTopic: 'Оберіть тему',
        chooseMode: 'Оберіть режим',
        learningMode: 'Режим навчання',
        testingMode: 'Режим тестування',
        backToTopics: 'Назад до тем',
        score: 'Бали',
        question: 'Питання',
        time: 'Час',
        summary: 'Підсумок',
        finalScore: 'Фінальний рахунок',
        accuracy: 'Точність',
        previous: 'Попереднє',
        next: 'Наступне',
        back: 'Назад'
    }
};

function sanitizeFilename(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '')  // Remove diacritical marks
        .replace(/[']/g, '_')              // Remove apostrophes
        .replace(/\s+/g, '_')             // Replace spaces with underscores
        .replace(/[^a-z0-9_-]/g, '');     // Remove any other special characters
}

// Load only config initially
async function loadTopics() {
    try {
        console.log('Loading config...');

        // Show loading state
        document.getElementById('topicList').innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;

        const configResponse = await fetch(`${basePath}/config.json`);
        if (!configResponse.ok) {
            throw new Error(`Failed to load config: ${configResponse.statusText}`);
        }

        const config = await configResponse.json();
        if (typeof config.topics === 'object' && config.topics !== null) {
            // Store only topic metadata initially
            topics = Object.fromEntries(
                Object.entries(config.topics).map(([name, file]) => [
                    name,
                    { file, name, loaded: false }
                ])
            );

            displayLanguageSelector();
            displayTopics();
        } else {
            throw new Error('Invalid config format');
        }
    } catch (error) {
        console.error('Error loading config:', error);
        document.getElementById('topicList').innerHTML = `
            <div class="error-message">
                Error loading topics. Please try again later.<br>
                ${error.message}
            </div>
        `;
    }
}

// Load topic when selected
async function selectTopic(topicId) {
    const topicButton = document.querySelector(`button[data-topic="${topicId}"]`);
    if (!topics[topicId].loaded) {
        try {
            // Show loading state
            topicButton.disabled = true;
            topicButton.innerHTML = `
                <span class="spinner"></span>
                Loading...
            `;

            // Load topic data
            const response = await fetch(`${basePath}/vocabulary/${topics[topicId].file}`);
            if (!response.ok) {
                throw new Error(`Failed to load topic ${topicId}`);
            }

            const topicData = await response.json();

            // Process words and add media paths
            topicData.words = topicData.words.map(word => {
                const sanitizedFrench = sanitizeFilename(word.french);
                return {
                    ...word,
                    media: {
                        audio: `${basePath}/media/audio/fr/${sanitizedFrench}.mp3`
                    }
                };
            });

            // Store the loaded topic
            topics[topicId] = {
                ...topics[topicId],
                ...topicData,
                loaded: true
            };

            // Reset button state
            topicButton.disabled = false;
            topicButton.textContent = topics[topicId][currentLanguage === 'ukrainian' ? 'name_uk' : 'name'];
            topicButton.classList.add('loaded');

            // Set as current topic and show mode selection
            currentTopic = topicId;
            currentIndex = 0;
            showModeSelection();

        } catch (error) {
            console.error('Error loading topic:', error);
            topicButton.innerHTML = `
                <div class="error-state">
                    Error loading topic<br>
                    <button onclick="selectTopic('${topicId}')">Retry</button>
                </div>
            `;
        }
    } else {
        // Topic already loaded
        currentTopic = topicId;
        currentIndex = 0;
        showModeSelection();
    }
}

function displayLanguageSelector() {
    const selector = document.getElementById('languageSelector');
    selector.innerHTML = '';

    Object.entries(supportedLanguages).forEach(([langKey, langInfo]) => {
        const option = document.createElement('option');
        option.value = langKey;
        option.textContent = langInfo.name;
        option.selected = langKey === currentLanguage;
        selector.appendChild(option);
    });
}

function changeLanguage(langKey) {
    currentLanguage = langKey;
    updateUILanguage();
    if (currentTopic && currentWord) {
        displayCurrentWord();
    }
    if (document.getElementById('testingMode').style.display === 'block') {
        generateQuestion();
    }
    displayTopics();
}

function updateUILanguage() {
    const translations = uiTranslations[currentLanguage];

    document.querySelector('#topicSelection h2').textContent = translations.selectTopic;
    document.querySelector('#modeSelection h2').textContent = translations.chooseMode;
    document.querySelector('#modeSelection button:nth-child(1)').textContent = translations.learningMode;
    document.querySelector('#modeSelection button:nth-child(2)').textContent = translations.testingMode;
    document.querySelector('#modeSelection button:nth-child(3)').textContent = translations.backToTopics;

    const learningControls = document.querySelector('#learningMode .controls');
    learningControls.querySelector('button:nth-child(1)').textContent = translations.previous;
    learningControls.querySelector('button:nth-child(2)').textContent = translations.next;
    learningControls.querySelector('button:nth-child(3)').textContent = translations.back;
}

// function displayTopics() {
//     const topicList = document.getElementById('topicList');
//     topicList.innerHTML = '';
//
//     Object.entries(topics).forEach(([id, topic]) => {
//         const button = document.createElement('button');
//         button.setAttribute('data-topic', id);
//         button.textContent = topic.loaded ?
//             (currentLanguage === 'ukrainian' ? topic.name_uk : topic.name) :
//             topic.name;
//         if (topic.loaded) {
//             button.classList.add('loaded');
//         }
//         button.onclick = () => selectTopic(id);
//         topicList.appendChild(button);
//     });
//
//     showSection('topicSelection');
// }

function displayTopics() {
    const root = ReactDOM.createRoot(document.getElementById('topicList'));
    root.render(React.createElement(TopicGrid, {
        topics: topics,
        currentLanguage: currentLanguage,
        onSelectTopic: selectTopic,
        basePath: basePath
    }));
    showSection('topicSelection');
}

function showModeSelection() {
    showSection('modeSelection');
}

function startLearningMode() {
    showSection('learningMode');
    displayCurrentWord();
}

function startTestingMode() {
    score = 0;
    questionCount = 0;
    showSection('testingMode');
    generateQuestion();
}

function displayCurrentWord() {
    const word = topics[currentTopic].words[currentIndex];

    document.getElementById('frenchWord').textContent = word.french;
    document.getElementById('nativeWord').textContent = word[currentLanguage === 'english' ? 'english' : 'ukrainian'];

    const exampleElement = document.getElementById('example');
    exampleElement.textContent = word.example;
    exampleElement.style.display = word.example ? 'block' : 'none';

    //const imageContainer = document.getElementById('wordImage');
    //imageContainer.innerHTML = `<img src="${word.media.image}" alt="${word.french}" onerror="this.onerror=null; this.style.display='none';">`;

    const audioContainer = document.getElementById('wordAudio');
    audioContainer.innerHTML = `
        <div class="audio-controls">
            <button onclick="playAudio('${word.media.audio}')" class="audio-btn" title="Listen in French">
                🔊
            </button>
        </div>
    `;

    // Automatically play audio
    setTimeout(() => {
        playAudio(word.media.audio);
    }, 500);
}

async function playAudio(audioUrl) {
    console.log('Attempting to play audio from URL:', audioUrl);
    try {
        const response = await fetch(audioUrl);
        if (!response.ok) {
            throw new Error(`Audio file not found (${response.status})`);
        }

        const audio = new Audio(audioUrl);
        await audio.play();
        console.log('Audio playback started successfully');
    } catch (error) {
        console.error('Error playing audio:', error);
    }
}

function nextWord() {
    if (currentIndex < topics[currentTopic].words.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    displayCurrentWord();
}

function previousWord() {
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = topics[currentTopic].words.length - 1;
    }
    displayCurrentWord();
}

function generateQuestion() {
    questionCount++;
    if (questionCount > 10) {
        showSummary();
        return;
    }

    const words = topics[currentTopic].words;
    currentWord = words[Math.floor(Math.random() * words.length)];

    const wrongOptions = words
        .filter(word => word !== currentWord)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    options = [...wrongOptions, currentWord].sort(() => Math.random() - 0.5);

    document.getElementById('testFrenchWord').textContent = currentWord.french;
    document.getElementById('questionCount').textContent = questionCount;
    document.getElementById('score').textContent = score;

    const audioContainer = document.getElementById('testAudio');
    audioContainer.innerHTML = `
        <div class="audio-controls">
            <button onclick="playAudio('${currentWord.media.audio}')" class="audio-btn" title="Listen in French">
                🔊
            </button>
        </div>
    `;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option[currentLanguage === 'english' ? 'english' : 'ukrainian'];
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });

    startTimer();
    playAudio(currentWord.media.audio);
}

function startTimer() {
    let timeLeft = 10;
    document.getElementById('timer').textContent = timeLeft;

    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function checkAnswer(index) {
    clearInterval(timer);
    const buttons = document.querySelectorAll('#options button');
    const selectedOption = options[index];

    buttons.forEach((button, i) => {
        if (options[i] === currentWord) {
            button.classList.add('correct');
        } else if (i === index && selectedOption !== currentWord) {
            button.classList.add('wrong');
        }
        button.disabled = true;
    });

    if (selectedOption === currentWord) {
        score++;
        document.getElementById('score').textContent = score;
        setTimeout(generateQuestion, 1000);
    } else {
        score = Math.max(0, score - 2);
        document.getElementById('score').textContent = score;
        setTimeout(generateQuestion, 1500);
    }
}

function handleTimeout() {
    const buttons = document.querySelectorAll('#options button');
    buttons.forEach((button, i) => {
        if (options[i] === currentWord) {
            button.classList.add('correct');
        }
        button.disabled = true;
    });
    score = Math.max(0, score - 2);
    document.getElementById('score').textContent = score;
    setTimeout(generateQuestion, 1500);
}

function showSummary() {
    const translations = uiTranslations[currentLanguage];
    const accuracy = Math.round((score / 10) * 100);
    document.getElementById('summaryContent').innerHTML = `
        <p>${translations.finalScore}: ${score}</p>
        <p>${translations.accuracy}: ${accuracy}%</p>
    `;
    showSection('summary');
}

function showSection(sectionId) {
    const sections = ['topicSelection', 'modeSelection', 'learningMode', 'testingMode', 'summary'];
    sections.forEach(id => {
        document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
    });
}

function showTopics() {
    if (timer) clearInterval(timer);
    displayTopics();
}

// Initialize the app
window.onload = function() {
    loadTopics().catch(console.error);
};