import React from 'react';

const TopicGrid = ({ topics, currentLanguage, onSelectTopic, basePath }) => {
    const getImageUrl = (topicId) => {
        // Use the basePath for GitHub Pages
        return `${basePath}/images/topics/${topicId}.jpg`;
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {Object.entries(topics).map(([id, topic]) => (
                <button
                    key={id}
                    onClick={() => onSelectTopic(id)}
                    className={`
            relative flex flex-col items-center justify-center p-4
            bg-white rounded-lg shadow-sm hover:shadow-md
            transition-all duration-200 ease-in-out
            border border-gray-200 hover:border-gray-300
            ${topic.loaded ? 'border-l-4 border-l-green-500' : ''}
            min-h-[160px] w-full
          `}
                    disabled={topic.loading}
                >
                    {topic.loading ? (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : topic.error ? (
                        <div className="text-center text-red-500">
                            <span className="block text-lg mb-2">⚠️</span>
                            <span className="text-sm">Error loading topic</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTopic(id);
                                }}
                                className="mt-2 text-xs bg-red-50 text-red-500 px-2 py-1 rounded"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 mb-3 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={getImageUrl(id)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `${basePath}/images/placeholder.jpg`;
                                    }}
                                />
                            </div>
                            <span className="text-sm font-medium text-center text-gray-700">
                {currentLanguage === 'ukrainian' && topic.name_uk
                    ? topic.name_uk
                    : topic.name}
              </span>
                            {topic.loaded && (
                                <span className="absolute top-2 right-2 text-xs text-green-500">✓</span>
                            )}
                        </>
                    )}
                </button>
            ))}
        </div>
    );
};

export default TopicGrid;