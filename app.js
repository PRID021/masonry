
const container = document.querySelector(".container");
const loadMoreButton = document.querySelector(".load-more-button");




function getColumnCount() {
    const width = window.innerWidth;
    if (width <= 600) {
        return 1; // 1 column for small screens (mobile)
    } else if (width <= 900) {
        return 2; // 2 columns for medium screens (tablet)
    } else {
        return 4; // 4 columns for large screens (desktop)
    }
}


let currentColumnCount = getColumnCount();



// Global cache to store image heights
const imageCache = new Map();

// Function to create or update the Masonry Grid
async function createMasonryGrid(columnCount, initialPosts) {
    let columnWrapper = Array.from({ length: columnCount }, () => []);
    let columnHeights = Array(columnCount).fill(0);

    let currentPosts = initialPosts


    // Helper function to distribute posts into columns
    async function distributePosts(posts) {
        // Fetch unique image URLs from the posts
        const uniqueImageUrls = [...new Set(posts.map(post => post.image))];

        // Fetch image heights for unique URLs
        const imageHeightsPromises = uniqueImageUrls.map(url => getImageHeight(url));
        const imageHeights = await Promise.all(imageHeightsPromises);

        // Create a map for fast lookup of image heights based on the URL
        const imageHeightMap = uniqueImageUrls.reduce((map, url, index) => {
            map[url] = imageHeights[index];
            return map;
        }, {});

        // Assign posts to columns based on image heights
        posts.forEach(post => {
            const imageHeight = imageHeightMap[post.image] || 0;
            const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights));
            columnWrapper[minHeightIndex].push(post);
            columnHeights[minHeightIndex] += imageHeight;
        });
    }

    // Function to render the grid
    function renderGrid() {
        container.innerHTML = ""; // Clear the container
        const fragment = document.createDocumentFragment();

        columnWrapper.forEach(columnPosts => {
            const columnDiv = document.createElement("div");
            columnDiv.classList.add("column");

            columnPosts.forEach(post => {
                const postDiv = document.createElement("div");
                postDiv.classList.add("post");

                const img = document.createElement("img");
                img.src = post.image;

                const overlayDiv = document.createElement("div");
                overlayDiv.classList.add("overlay");

                const h3Title = document.createElement("h3");
                h3Title.innerText = post.title;

                overlayDiv.appendChild(h3Title);
                postDiv.appendChild(img);
                postDiv.appendChild(overlayDiv);
                columnDiv.appendChild(postDiv);
            });

            fragment.appendChild(columnDiv);
        });

        container.appendChild(fragment);
    }

    // Initial distribution and render
    await distributePosts(initialPosts);
    renderGrid();

    // Return an update function to add more posts
    return [async function updateMasonryGrid(newPosts) {
        currentPosts = [...currentPosts, ...newPosts]
        await distributePosts(newPosts);
        renderGrid(); // Re-render with the new posts included
    }, async function resizeGridColumn() {
        currentColumnCount = getColumnCount();
        columnWrapper = Array.from({ length: currentColumnCount }, () => []);
        columnHeights = Array(currentColumnCount).fill(0);
        await distributePosts(currentPosts)
        renderGrid();
    }];
}

// Helper function to get image height with caching
function getImageHeight(url) {
    if (imageCache.has(url)) {
        return Promise.resolve(imageCache.get(url));
    }

    return new Promise(resolve => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            imageCache.set(url, img.height);
            resolve(img.height);
        };
        img.onerror = () => {
            imageCache.set(url, 0);
            resolve(0);
        };
    });
}




// Example Usage
(async function () {
    const initialPosts = await fetchImages();
    const [updateMasonryGrid, resizeGridColumn] = await createMasonryGrid(currentColumnCount, initialPosts);

    // Event listener for "Load More" button
    loadMoreButton.addEventListener("click", async () => {
        const morePosts = await fetchImages();
        if (morePosts.length > 0) {
            await updateMasonryGrid(morePosts);
        }
    });



    // Handle window resizing to update the grid when screen size changes
    window.addEventListener('resize', async () => {
        if (currentColumnCount !== getColumnCount()) {
            resizeGridColumn()
        }
    });
})();



