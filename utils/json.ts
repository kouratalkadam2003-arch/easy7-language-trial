

export const cleanAndParseJson = (jsonString: string) => {
    let cleanString = jsonString;
    // Attempt to extract JSON from markdown code blocks
    const jsonMatch = jsonString.match(/```(?:json\s*)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
        cleanString = jsonMatch[1].trim();
    } else {
        // Fallback for non-markdown-wrapped JSON: find the first and last curly braces
        const startIndex = jsonString.indexOf('{');
        const endIndex = jsonString.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            cleanString = jsonString.substring(startIndex, endIndex + 1);
        }
    }
    try {
        return JSON.parse(cleanString);
    } catch (e) {
        console.error("Failed to parse JSON string:", cleanString, "Original string:", jsonString);
        throw new Error("Invalid JSON format received from API.");
    }
};