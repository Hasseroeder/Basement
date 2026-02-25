export async function loadJson(path) {
    var jsonData;
    try {
        const response = await fetch(path);
        jsonData = await response.json();
    } catch (error) {
        console.error("Error loading json:", error);
    }
    return jsonData;
} 

export async function loadAll(obj) { 
    const entries = Object.entries(obj);
    const results = await Promise.all(
        entries.map(([_, p]) => p)
    ); 
    return Object.fromEntries( 
        entries.map(([key], i) => [key, results[i]]) 
    ); 
}