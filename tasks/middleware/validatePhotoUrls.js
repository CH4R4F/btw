function validatePhotoUrls(urls) {
    if (!Array.isArray(urls)) return [];
    return urls.filter((u) => {
        try {
            const parsed = new URL(u);
            return parsed.protocol === "https:";
        } catch {
            return false;
        }
    });
}

module.exports = { validatePhotoUrls };
