console.log("Chat script loaded successfully!");

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const chatContainer = document.getElementById('chat-container');

    if (!toggleBtn) {
        console.error("ERROR: Could not find button with ID 'chat-toggle-btn'");
        return;
    }
    
    if (!chatContainer) {
        console.error("ERROR: Could not find div with ID 'chat-container'");
        return;
    }

    console.log("Buttons found, adding click listener...");

    toggleBtn.addEventListener('click', () => {
        console.log("Button clicked!");
        chatContainer.classList.toggle('active');
        console.log("Chat container classes:", chatContainer.className);
    });
    
    // ... (rest of your existing close button and send logic) ...
    const closeBtn = document.getElementById('chat-close-btn');
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatContainer.classList.remove('active');
        });
    }
});