async function fetchImages(limit = 20, query = "") {
    try {

        const url = `https://api.unsplash.com/photos/random?count=${limit}&query=${query}&client_id=${accessKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();

        const newPosts = data.map((image, index) => ({
            id: index,
            title: image.description || image.alt_description || `Post ${index}`,
            image: image.urls.small
        }));

        return newPosts;

    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
}

