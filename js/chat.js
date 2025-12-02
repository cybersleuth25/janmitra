document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const chatContainer = document.getElementById('chat-container');
    const sendBtn = document.getElementById('chat-send-btn');
    const inputField = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    // Toggle Chat Window
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            chatContainer.style.display = chatContainer.style.display === 'flex' ? 'none' : 'flex';
            if(chatContainer.style.display === 'flex') inputField.focus();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });
    }

    // Send Message Function
    async function sendMessage() {
        const message = inputField.value.trim();
        if (!message) return;

        // 1. Add User Message
        addMessage(message, 'user-message');
        inputField.value = '';
        inputField.disabled = true;

        // 2. Show Loading Indicator
        const loadingId = addMessage('Typing...', 'bot-message', true);

        try {
            // 3. Send to Backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            // 4. Remove Loading & Add Bot Response
            removeMessage(loadingId);
            
            if (data.response) {
                // Format bold text from markdown (**text**) to HTML <b>text</b>
                let cleanText = data.response.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                addMessage(cleanText, 'bot-message');
            } else {
                addMessage("I'm having trouble connecting right now. Please try again.", 'bot-message');
            }

        } catch (error) {
            console.error('Chat Error:', error);
            removeMessage(loadingId);
            addMessage("Sorry, something went wrong. Is the server running?", 'bot-message');
        } finally {
            inputField.disabled = false;
            inputField.focus();
        }
    }

    // Event Listeners for Sending
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Helper: Add Message to DOM
    function addMessage(text, className, isTemp = false) {
        const div = document.createElement('div');
        div.className = `message ${className}`;
        div.style.cssText = `
            padding: 0.75rem; 
            border-radius: 8px; 
            margin-bottom: 1rem; 
            font-size: 0.9rem; 
            max-width: 80%;
            line-height: 1.4;
        `;
        
        // Styling distinction
        if (className === 'user-message') {
            div.style.backgroundColor = '#3B82F6';
            div.style.color = 'white';
            div.style.alignSelf = 'flex-end';
            div.style.marginLeft = 'auto';
            div.style.borderBottomRightRadius = '0';
        } else {
            div.style.backgroundColor = '#F1F5F9';
            div.style.color = '#1E293B';
            div.style.alignSelf = 'flex-start';
            div.style.borderBottomLeftRadius = '0';
            div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        }

        div.innerHTML = text;
        
        if (isTemp) {
            div.id = 'temp-loading-' + Date.now();
        }

        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return div.id;
    }

    // Helper: Remove Message (for loading state)
    function removeMessage(id) {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});