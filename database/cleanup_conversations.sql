-- ========================================
-- CLEAN UP EXISTING CONVERSATION MESSAGES
-- Run this in pgAdmin Query Tool for database: networld
-- ========================================

-- This will clean up quoted text from existing messages
-- Removes everything after "On ... wrote:" pattern

UPDATE conversations 
SET message = CASE
    -- Extract only the text before "On " pattern (email thread)
    WHEN message LIKE '%On %wrote:%' THEN 
        TRIM(SUBSTRING(message FROM 1 FOR POSITION('On ' IN message) - 1))
    
    -- Extract only the text before "From:" pattern (Outlook style)
    WHEN message LIKE '%From:%Sent:%' THEN 
        TRIM(SUBSTRING(message FROM 1 FOR POSITION('From:' IN message) - 1))
    
    -- Keep original if no pattern found
    ELSE message
END
WHERE sender_type != 'admin';

-- Remove lines starting with > (quoted lines)
UPDATE conversations
SET message = regexp_replace(message, '^>.*$', '', 'gm')
WHERE sender_type != 'admin';

-- Clean up multiple newlines and whitespace
UPDATE conversations
SET message = regexp_replace(trim(message), '\n{3,}', E'\n\n', 'g')
WHERE sender_type != 'admin';

-- Show cleaned messages
SELECT 
    id,
    tracking_number,
    sender_name,
    LEFT(message, 100) as cleaned_message,
    created_at
FROM conversations
WHERE sender_type != 'admin'
ORDER BY created_at DESC;

SELECT 'Conversation messages cleaned successfully!' AS status;
