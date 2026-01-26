export const loadThaiFont = async (doc) => {
    try {
        // Fetch from local public folder to avoid CORS
        const response = await fetch('/Sarabun-Regular.ttf');
        if (!response.ok) throw new Error('Failed to fetch font');

        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                doc.addFileToVFS('Sarabun-Regular.ttf', base64data);
                doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
                doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'bold');
                resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error loading Thai font:", error);
    }
};
