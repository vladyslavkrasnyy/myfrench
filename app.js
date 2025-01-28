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
    // Add more languages as needed
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
        accuracy: 'Accuracy'
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
        accuracy: 'Точність'
    }
};

async function loadTopics() {
    try {
        console.log('Starting to load topics...');

        const configPath = `${basePath}/vocabulary/config.json`;
        console.log('Loading config from:', configPath);
        const configResponse = await fetch(configPath);
        if (!configResponse.ok) {
            throw new Error(`Failed to load config: ${configResponse.statusText}`);
        }
        const config = await configResponse.json();

        if (typeof config.topics === 'object' && config.topics !== null) {
            for (const [topicName, topicFile] of Object.entries(config.topics)) {
                const topicPath = `${basePath}/vocabulary/${topicFile}`;
                const response = await fetch(topicPath);
                if (!response.ok) {
                    throw new Error(`Failed to load topic ${topicName}`);
                }
                topics[topicName] = await response.json();

                // Load media for each word if available
                for (let word of topics[topicName].words) {
                    word.media = {
                        image: `${basePath}/media/images/${word.french.replace(/\s+/g, '_')}.jpg`,
                        audio: {
                            french: `${basePath}/media/audio/fr/${word.french.replace(/\s+/g, '_')}.mp3`,
                            [currentLanguage]: `${basePath}/media/audio/${supportedLanguages[currentLanguage].code}/${word[currentLanguage].replace(/\s+/g, '_')}.mp3`
                        }
                    };
                }
            }

            console.log('All topics loaded:', topics);
            displayLanguageSelector();
            displayTopics();
        } else {
            throw new Error('Invalid format: config.topics should be an object.');
        }
    } catch (error) {
        console.error('Error loading topics:', error);
        document.getElementById('topicList').innerHTML = `
            <div style="color: red; text-align: center;">
                Error loading topics. Please try again later.<br>
                Error details: ${error.message}
            </div>
        `;
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
    displayTopics();
}

function updateUILanguage() {
    const translations = uiTranslations[currentLanguage];

    // Update all UI elements with translated text
    document.querySelector('#topicSelection h2').textContent = translations.selectTopic;
    document.querySelector('#modeSelection h2').textContent = translations.chooseMode;
    // ... update other UI elements
}

// Display current word in learning mode with media
function displayCurrentWord() {
    const word = topics[currentTopic].words[currentIndex];
    document.getElementById('frenchWord').textContent = word.french;
    document.getElementById('nativeWord').textContent = word[currentLanguage];
    document.getElementById('example').textContent = word.example;

    // Display image if available
    const imageContainer = document.getElementById('wordImage');
    imageContainer.innerHTML = `<img src="${word.media.image}" alt="${word.french}" onerror="this.style.display='none'">`;

    // Add audio players
    const audioContainer = document.getElementById('wordAudio');
    audioContainer.innerHTML = `
        <div class="audio-controls">
            <button onclick="playAudio('${word.media.audio.french}')" class="audio-btn">
                🔊 French
            </button>
            <button onclick="playAudio('${word.media.audio[currentLanguage]}')" class="audio-btn">
                🔊 ${supportedLanguages[currentLanguage].name}
            </button>
        </div>
    `;
}

// Audio playback function
function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

// Display available topics
function displayTopics() {
    const topicList = document.getElementById('topicList');
    topicList.innerHTML = '';

    Object.entries(topics).forEach(([id, topic]) => {
        const button = document.createElement('button');
        button.textContent = topic.name;
        button.onclick = () => selectTopic(id);
        topicList.appendChild(button);
    });

    showSection('topicSelection');
}

// Topic selection
function selectTopic(topicId) {
    currentTopic = topicId;
    currentIndex = 0;
    showModeSelection();
}

// Show mode selection
function showModeSelection() {
    showSection('modeSelection');
}

// Start learning mode
function startLearningMode() {
    showSection('learningMode');
    displayCurrentWord();
}

// Start testing mode
function startTestingMode() {
    score = 0;
    questionCount = 0;
    showSection('testingMode');
    generateQuestion();
}

// Navigation in learning mode
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

// Generate question for testing mode
function generateQuestion() {
    questionCount++;
    if (questionCount > 10) {
        showSummary();
        return;
    }

    const words = topics[currentTopic].words;
    currentWord = words[Math.floor(Math.random() * words.length)];

    // Generate options
    const wrongOptions = words
        .filter(word => word !== currentWord)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    options = [...wrongOptions, currentWord].sort(() => Math.random() - 0.5);

    // Update display
    document.getElementById('testFrenchWord').textContent = currentWord.french;
    document.getElementById('testExample').textContent = currentWord.example;
    document.getElementById('questionCount').textContent = questionCount;
    document.getElementById('score').textContent = score;

    // Display options
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option.english;
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });

    // Start timer
    startTimer();
}

// Timer functionality
function startTimer() {
    let timeLeft = 20;
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

// Handle answer selection
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
        score = Math.max(0, score - 2); // Deduct 2 points for wrong answer
        document.getElementById('score').textContent = score;
        // Allow seeing the correct answer before next question
        setTimeout(generateQuestion, 1500);
    }
}

// Handle timeout
function handleTimeout() {
    const buttons = document.querySelectorAll('#options button');
    buttons.forEach((button, i) => {
        if (options[i] === currentWord) {
            button.classList.add('correct');
        }
        button.disabled = true;
    });
    score = Math.max(0, score - 2); // Deduct 2 points for timeout
    document.getElementById('score').textContent = score;
    setTimeout(generateQuestion, 1000);
}

// Show summary
function showSummary() {
    const accuracy = Math.round((score / 10) * 100);
    document.getElementById('summaryContent').innerHTML = `
        <p>Final Score: ${score}</p>
        <p>Accuracy: ${accuracy}%</p>
    `;
    showSection('summary');
}

// Utility function to show specific section
function showSection(sectionId) {
    const sections = ['topicSelection', 'modeSelection', 'learningMode', 'testingMode', 'summary'];
    sections.forEach(id => {
        document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
    });
}

// Helper function to go back to topics
function showTopics() {
    if (timer) clearInterval(timer);
    displayTopics();
}

// Initialize the app
window.onload = function() {
    loadTopics().catch(console.error);
};
