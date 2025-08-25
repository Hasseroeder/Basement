async function loadJson(path) {
    var jsonData;
    try {
        const response = await fetch(path);
        jsonData = await response.json();
    } catch (error) {
        console.error("Error loading json:", error);
    }
    return jsonData;
} 

export {loadJson};