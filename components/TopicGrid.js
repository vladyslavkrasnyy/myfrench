window.TopicGrid = function TopicGrid({ topics, currentLanguage, onSelectTopic, basePath }) {
    const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Cg fill='%23d1d5db'%3E%3Cpath d='M40 30h40v8H40zM30 50h60v6H30zM35 65h50v6H35zM45 80h30v6H45z'/%3E%3C/g%3E%3C/svg%3E";

    const getImageUrl = (topicId) => {
        return `${basePath}/media/images/topics/${topicId}.jpg`;
    };

    return React.createElement("div", {
        className: "grid grid-cols-3 gap-0 mx-auto", // Fixed to 3 columns, removed responsive columns
        style: {
            width: '800px' // 280px * 3 columns
        }
    }, Object.entries(topics).map(([id, topic]) =>
        React.createElement("button", {
                key: id,
                onClick: () => onSelectTopic(id),
                className: "relative group border-0 outline-none focus:outline-none rounded-lg overflow-hidden",
                style: {
                    lineHeight: 0,
                    padding: 0,
                    background: 'none',
                    width: '262px',
                    height: '262px'
                },
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
                        className: "absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg"
                    },
                    React.createElement("div", {
                            className: "text-center text-red-500"
                        },
                        React.createElement("span", {
                            className: "block text-lg"
                        }, "⚠️")
                    )
                )
            ) : (
                React.createElement(React.Fragment, null,
                    React.createElement("img", {
                        src: getImageUrl(id),
                        alt: "",
                        className: "absolute inset-0 w-full h-full object-cover rounded-lg",
                        style: { margin: 0, display: 'block' },
                        onError: (e) => {
                            if (e.target.src !== placeholderImage) {
                                e.target.src = placeholderImage;
                            }
                        }
                    }),
                    React.createElement("div", {
                        className: "absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity rounded-lg"
                    }),
                    React.createElement("div", {
                        className: "absolute bottom-0 left-0 right-0 text-center p-1 text-white text-sm bg-black bg-opacity-50 rounded-b-lg"
                    }, currentLanguage === 'ukrainian' ? topic.name_uk : topic.name_en)
                )
            )
        )
    ));
};