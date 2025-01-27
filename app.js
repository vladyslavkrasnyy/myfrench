let topics = {};
let currentTopic = null;
let currentIndex = 0;
let currentWord = null;
let options = [];
let score = 0;
let questionCount = 0;
let timer = null;

// Base path for GitHub Pages
const basePath = '/myfrench';

// Load topics from config
async function loadTopics() {
    try {
        console.log('Starting to load topics...');

        const configResponse = await fetch(`${basePath}/vocabulary/config.json`);
        if (!configResponse.ok) {
            throw new Error(`Failed to load config: ${configResponse.status}`);
        }
        const config = await configResponse.json();
        console.log('Loaded config:', config);

        // Load each topic
        for (const topicName of config.topics) {
            console.log(`Loading topic: ${topicName}`);
            const response = await fetch(`${basePath}/vocabulary/${topicName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load topic ${topicName}: ${response.status}`);
            }
            topics[topicName] = await response.json();
        }

        console.log('All topics loaded:', topics);
        displayTopics();
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

// Display current word in learning mode
function displayCurrentWord() {
    const word = topics[currentTopic].words[currentIndex];
    document.getElementById('frenchWord').textContent = word.french;
    document.getElementById('englishWord').textContent = word.english;
    document.getElementById('example').textContent = word.example;
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
    setTimeout(generateQuestion, 1500);
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
