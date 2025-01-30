// Remove the import/export syntax and make it global
window.TopicGrid = function TopicGrid({ topics, currentLanguage, onSelectTopic, basePath }) {
    const getImageUrl = (topicId) => {
        return `${basePath}/images/topics/${topicId}.jpg`;
    };

    return React.createElement("div", {
        className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4"
    }, Object.entries(topics).map(([id, topic]) =>
        React.createElement("button", {
                key: id,
                onClick: () => onSelectTopic(id),
                className: `
        relative flex flex-col items-center justify-center p-4
        bg-white rounded-lg shadow-sm hover:shadow-md
        transition-all duration-200 ease-in-out
        border border-gray-200 hover:border-gray-300
        ${topic.loaded ? 'border-l-4 border-l-green-500' : ''}
        min-h-[160px] w-full
      `,
                disabled: topic.loading
            },
            topic.loading ? (
                React.createElement("div", {
                        className: "absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg"
                    },
                    React.createElement("div", {
                        className: "w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                    })
                )
            ) : topic.error ? (
                React.createElement("div", {
                        className: "text-center text-red-500"
                    },
                    React.createElement("span", {
                        className: "block text-lg mb-2"
                    }, "⚠️"),
                    React.createElement("span", {
                        className: "text-sm"
                    }, "Error loading topic"),
                    React.createElement("button", {
                        onClick: (e) => {
                            e.stopPropagation();
                            onSelectTopic(id);
                        },
                        className: "mt-2 text-xs bg-red-50 text-red-500 px-2 py-1 rounded"
                    }, "Retry")
                )
            ) : (
                React.createElement(React.Fragment, null,
                    React.createElement("div", {
                            className: "w-16 h-16 mb-3 rounded-lg overflow-hidden bg-gray-100"
                        },
                        React.createElement("img", {
                            src: getImageUrl(id),
                            alt: "",
                            className: "w-full h-full object-cover",
                            onError: (e) => {
                                e.target.onerror = null;
                                e.target.src = `${basePath}/images/placeholder.jpg`;
                            }
                        })
                    ),
                    React.createElement("span", {
                        className: "text-sm font-medium text-center text-gray-700"
                    }, currentLanguage === 'ukrainian' && topic.name_uk ? topic.name_uk : topic.name),
                    topic.loaded && React.createElement("span", {
                        className: "absolute top-2 right-2 text-xs text-green-500"
                    }, "✓")
                )
            )
        )
    ));
};