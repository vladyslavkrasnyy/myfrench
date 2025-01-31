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
let isLoadingTopics = false;
let lastRenderedTopics = null;
let topicsRoot = null;

// Base path for GitHub Pages
const basePath = '/myfrench';

// Fetch configuration
const fetchConfig = {
    cache: 'force-cache',
    headers: {
        'Cache-Control': 'max-age=3600',
        'Pragma': 'no-cache'
    }
};

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

async function loadTopics() {
    if (isLoadingTopics) return;

    try {
        isLoadingTopics = true;
        console.log('Loading config...');

        // Show loading state
        document.getElementById('topicList').innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;

        const configResponse = await fetch(`${basePath}/config.json`, fetchConfig);

        if (!configResponse.ok) {
            throw new Error(`Failed to load config: ${configResponse.statusText}`);
        }

        const config = await configResponse.json();
        if (typeof config.topics === 'object' && config.topics !== null) {
            topics = Object.fromEntries(
                Object.entries(config.topics).map(([id, topicData]) => [
                    id,
                    {
                        file: topicData.file,
                        name_en: topicData.name_en,
                        name_uk: topicData.name_uk,
                        loaded: false
                    }
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
    } finally {
        isLoadingTopics = false;
    }
}

async function selectTopic(topicId) {
    const topic = topics[topicId];
    if (!topic || topic.loading) return;

    if (!topic.loaded) {
        try {
            topic.loading = true;
            displayTopics(); // Update UI to show loading state

            const response = await fetch(`${basePath}/vocabulary/${topic.file}`, fetchConfig);

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
                name_en: topics[topicId].name_en, // Preserve the names
                name_uk: topics[topicId].name_uk,
                loaded: true,
                loading: false
            };

            // Set as current topic and show mode selection
            currentTopic = topicId;
            currentIndex = 0;
            showModeSelection();

        } catch (error) {
            console.error('Error loading topic:', error);
            topics[topicId].loading = false;
            topics[topicId].error = true;
            displayTopics(); // Refresh to show error state
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

    const modeButtons = document.querySelectorAll('#modeSelection button');
    if (modeButtons.length >= 3) {
        modeButtons[0].textContent = translations.learningMode;
        modeButtons[1].textContent = translations.testingMode;
        modeButtons[2].textContent = translations.backToTopics;
    }

    const learningControls = document.querySelectorAll('#learningMode .controls button');
    if (learningControls.length >= 3) {
        learningControls[0].textContent = translations.previous;
        learningControls[1].textContent = translations.next;
        learningControls[2].textContent = translations.back;
    }
}

function displayTopics() {
    // Force re-render on language change by setting lastRenderedTopics to null
    if (lastRenderedTopics && currentLanguage !== lastLanguage) {
        lastRenderedTopics = null;
    }

    const topicsString = JSON.stringify(topics) + currentLanguage; // Include language in cache key
    if (lastRenderedTopics === topicsString) {
        return; // Skip if nothing changed
    }
    lastRenderedTopics = topicsString;
    lastLanguage = currentLanguage; // Store current language

    if (!topicsRoot) {
        topicsRoot = ReactDOM.createRoot(document.getElementById('topicList'));
    }

    topicsRoot.render(React.createElement(TopicGrid, {
        topics: topics,
        currentLanguage: currentLanguage,
        onSelectTopic: selectTopic,
        basePath: basePath,
        key: currentLanguage // Add key to force re-render
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
    if (!currentTopic || !topics[currentTopic] || !topics[currentTopic].words) return;

    const word = topics[currentTopic].words[currentIndex];
    if (!word) return;

    document.getElementById('frenchWord').textContent = word.french;
    document.getElementById('nativeWord').textContent =
        word[currentLanguage === 'english' ? 'english' : 'ukrainian'];

    const exampleElement = document.getElementById('example');
    exampleElement.textContent = word.example || '';
    exampleElement.style.display = word.example ? 'block' : 'none';

    const audioContainer = document.getElementById('wordAudio');
    if (word.media && word.media.audio) {
        audioContainer.innerHTML = `
            <div class="audio-controls">
                <button onclick="playAudio('${word.media.audio}')" class="audio-btn" title="Listen in French">
                    🔊
                </button>
            </div>
        `;

        // Delayed audio playback
        setTimeout(() => {
            playAudio(word.media.audio).catch(console.error);
        }, 500);
    } else {
        audioContainer.innerHTML = ''; // Clear if no audio available
    }
}

async function playAudio(audioUrl) {
    try {
        const response = await fetch(audioUrl, fetchConfig);
        if (!response.ok) {
            throw new Error(`Audio file not found (${response.status})`);
        }

        const audio = new Audio(audioUrl);
        await audio.play();
    } catch (error) {
        console.error('Error playing audio:', error);
    }
}

function nextWord() {
    if (!currentTopic || !topics[currentTopic] || !topics[currentTopic].words) return;

    if (currentIndex < topics[currentTopic].words.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    displayCurrentWord();
}

function previousWord() {
    if (!currentTopic || !topics[currentTopic] || !topics[currentTopic].words) return;

    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = topics[currentTopic].words.length - 1;
    }
    displayCurrentWord();
}

function generateQuestion() {
    if (!currentTopic || !topics[currentTopic] || !topics[currentTopic].words) return;

    const words = topics[currentTopic].words;

    // Check if we have enough words for options
    if (words.length < 4) {
        console.error('Not enough words for generating options');
        return;
    }

    questionCount++;
    if (questionCount > 10) {
        showSummary();
        return;
    }

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
    if (currentWord.media && currentWord.media.audio) {
        audioContainer.innerHTML = `
            <div class="audio-controls">
                <button onclick="playAudio('${currentWord.media.audio}')" class="audio-btn" title="Listen in French">
                    🔊
                </button>
            </div>
        `;
        playAudio(currentWord.media.audio).catch(console.error);
    } else {
        audioContainer.innerHTML = '';
    }

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option[currentLanguage === 'english' ? 'english' : 'ukrainian'];
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });

    startTimer();
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
        const element = document.getElementById(id);
        if (element) {
            element.style.display = id === sectionId ? 'block' : 'none';
        }
    });
}

function showTopics() {
    if (timer) clearInterval(timer);
    displayTopics();
}

// Cleanup function for unmounting
function cleanup() {
    if (timer) clearInterval(timer);
    if (topicsRoot) {
        topicsRoot.unmount();
        topicsRoot = null;
    }
}

// Initialize the app
window.onload = function() {
    loadTopics().catch(console.error);
};

// Add cleanup on page unload
window.onunload = cleanup;
